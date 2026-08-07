// Command fuelcron pulls one state's fuel prices per run from the sptspl
// API and upserts them.
//
// One state per run rather than all 35 in a loop: the upstream is a
// scraper-backed PHP endpoint on a shared host, and hammering it with 35
// requests in a burst is how you get rate-limited or blocked. Run it every
// minute from cron and the whole country refreshes in about half an hour,
// which is far faster than prices actually change.
//
// Each run takes the next state still behind today, so the job is
// self-limiting: once every state has today's prices it goes quiet, and a
// missed run self-heals on the next tick without needing a queue flag.
//
//	fuelcron            # refresh the next state behind today
//	fuelcron -state=Bihar
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/timesauto/go-backend/internal/config"
)

type apiRow struct {
	CityName    string `json:"cityName"`
	FuelType    string `json:"fuelType"`
	RetailPrice string `json:"retailPrice"`
	PriceChange string `json:"retailPriceChange"`
}

var fuelCodes = map[string]int16{"petrol": 1, "diesel": 2, "cng": 3}

// The only two names the upstream spells differently from us.
var cityAliases = map[string]string{"Bangalore": "Bengaluru", "Mysore": "Mysuru"}

func main() {
	stateFlag := flag.String("state", "", "state to refresh; default is the stalest")
	flag.Parse()

	log := slog.New(slog.NewTextHandler(os.Stdout, nil))
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	cfg, err := config.Load()
	if err != nil {
		log.Error("config", "err", err)
		os.Exit(1)
	}
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("db connect", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	today := time.Now().In(mustIST()).Format("2006-01-02")

	state := *stateFlag
	if state == "" {
		state, err = nextStaleState(ctx, pool, today)
		if errors.Is(err, errAllCurrent) {
			log.Info("nothing to do", "reason", "every state already has today's prices")
			return
		}
		if err != nil {
			log.Error("pick state", "err", err)
			os.Exit(1)
		}
	}

	rows, err := fetch(ctx, state)
	if err != nil {
		log.Error("fetch", "state", state, "err", err)
		os.Exit(1)
	}

	saved, skipped, err := upsert(ctx, pool, state, rows, today)
	if err != nil {
		log.Error("upsert", "state", state, "err", err)
		os.Exit(1)
	}
	log.Info("fuel refreshed", "state", state, "fetched", len(rows), "saved", saved, "unknownCities", skipped)
}

// The next state still missing today's prices.
//
// Deliberately not "the state with the oldest data": once every state has
// today's prices they all tie, and the tie-break then pins the job to
// whichever name sorts first, re-fetching it every minute forever. Asking
// for states behind today instead makes the job self-limiting — it goes
// quiet for the rest of the day once the country is covered.
var errAllCurrent = errors.New("all states already have today's prices")

func nextStaleState(ctx context.Context, pool *pgxpool.Pool, today string) (string, error) {
	const q = `
		SELECT s.name
		FROM states s
		JOIN cities c ON c.state_id = s.id
		JOIN fuel_prices f ON f.city_id = c.id
		GROUP BY s.id, s.name
		HAVING max(f.applicable_on) < $1::date
		ORDER BY max(f.applicable_on) ASC, s.name ASC
		LIMIT 1`
	var name string
	err := pool.QueryRow(ctx, q, today).Scan(&name)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", errAllCurrent
	}
	return name, err
}

func fetch(ctx context.Context, state string) ([]apiRow, error) {
	base := os.Getenv("FUEL_API_BASE_URL")
	user := os.Getenv("FUEL_API_USERNAME")
	token := os.Getenv("FUEL_API_TOKEN")
	if base == "" || user == "" || token == "" {
		return nil, fmt.Errorf("FUEL_API_BASE_URL, FUEL_API_USERNAME and FUEL_API_TOKEN must all be set")
	}

	u, err := url.Parse(base)
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("state", state)
	q.Set("username", user)
	q.Set("token", token)
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := (&http.Client{Timeout: 30 * time.Second}).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("upstream status %s", resp.Status)
	}

	var rows []apiRow
	if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func upsert(ctx context.Context, pool *pgxpool.Pool, state string, rows []apiRow, today string) (saved, skipped int, err error) {
	// The unique key on (city, fuel, day) makes this idempotent, so a
	// re-run within the same day corrects a price rather than duplicating.
	const q = `
		INSERT INTO fuel_prices (city_id, fuel_type, price, price_change, applicable_on)
		SELECT c.id, $1, $2, $3, $4::date
		FROM cities c JOIN states s ON s.id = c.state_id
		WHERE lower(s.name) = lower($5) AND lower(c.name) = lower($6)
		ON CONFLICT (city_id, fuel_type, applicable_on)
		DO UPDATE SET price = EXCLUDED.price, price_change = EXCLUDED.price_change`

	for _, r := range rows {
		code, ok := fuelCodes[strings.ToLower(strings.TrimSpace(r.FuelType))]
		if !ok {
			continue
		}
		price, convErr := strconv.ParseFloat(strings.TrimSpace(r.RetailPrice), 64)
		if convErr != nil || price <= 0 {
			continue
		}
		change, _ := strconv.ParseFloat(strings.TrimSpace(r.PriceChange), 64)

		name := strings.TrimSpace(r.CityName)
		if alias, ok := cityAliases[name]; ok {
			name = alias
		}

		tag, execErr := pool.Exec(ctx, q, code, price, change, today, state, name)
		if execErr != nil {
			return saved, skipped, execErr
		}
		// A city the upstream knows and we do not is logged by count and
		// skipped; inventing a city row here would put an unreviewed name
		// into the same table the site's URLs are built from.
		if tag.RowsAffected() == 0 {
			skipped++
			continue
		}
		saved++
	}
	return saved, skipped, nil
}

func mustIST() *time.Location {
	loc, err := time.LoadLocation("Asia/Kolkata")
	if err != nil {
		return time.FixedZone("IST", 5*3600+1800)
	}
	return loc
}
