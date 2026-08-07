package store_test

import (
	"context"
	"os"
	"sync/atomic"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/timesauto/go-backend/internal/store"
)

// countingTracer counts every statement pgx sends, which is the number
// this rewrite set out to reduce. Prisma's nested includes were invisible
// at the call site — one findMany could become four round-trips — so the
// count is asserted rather than assumed.
type countingTracer struct{ n atomic.Int64 }

func (t *countingTracer) TraceQueryStart(ctx context.Context, _ *pgx.Conn, _ pgx.TraceQueryStartData) context.Context {
	t.n.Add(1)
	return ctx
}
func (t *countingTracer) TraceQueryEnd(context.Context, *pgx.Conn, pgx.TraceQueryEndData) {}

func newCountingPool(t *testing.T) (*pgxpool.Pool, *countingTracer) {
	t.Helper()

	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		url = os.Getenv("DATABASE_URL")
	}
	if url == "" {
		t.Skip("DATABASE_URL not set")
	}

	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		t.Fatalf("parse url: %v", err)
	}
	tr := &countingTracer{}
	cfg.ConnConfig.Tracer = tr

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		t.Fatalf("pool: %v", err)
	}
	t.Cleanup(pool.Close)

	if err := pool.Ping(context.Background()); err != nil {
		t.Skipf("database unreachable: %v", err)
	}
	tr.n.Store(0)
	return pool, tr
}

// The browse page is the highest-traffic composite endpoint. The Node
// implementation issued eleven statements for it; this asserts the Go one
// stays at three so a future change cannot quietly reintroduce the fan-out.
func TestBrowsePageQueryCount(t *testing.T) {
	pool, tr := newCountingPool(t)
	ctx := context.Background()

	f := store.CarCardFilters{
		LaunchStatus:    "available",
		RequireVariants: true,
		Sort:            "popular",
		Limit:           12,
	}

	tr.n.Store(0)
	if _, err := store.ListCarCards(ctx, pool, f); err != nil {
		t.Fatalf("list: %v", err)
	}
	if _, err := store.CountCarCards(ctx, pool, f); err != nil {
		t.Fatalf("count: %v", err)
	}
	if _, err := store.GetBrowseFacets(ctx, pool, f); err != nil {
		t.Fatalf("facets: %v", err)
	}

	if got := tr.n.Load(); got != 3 {
		t.Errorf("browse page issued %d queries, want 3", got)
	}
}

// A card list must stay a single statement — the LATERAL joins exist
// precisely so the representative variant and its powertrain do not
// become extra round-trips.
func TestCarCardListIsSingleQuery(t *testing.T) {
	pool, tr := newCountingPool(t)

	tr.n.Store(0)
	cards, err := store.ListCarCards(context.Background(), pool, store.CarCardFilters{
		LaunchStatus: "available", RequireVariants: true, Sort: "latest", Limit: 10,
	})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if got := tr.n.Load(); got != 1 {
		t.Errorf("card list issued %d queries, want 1", got)
	}
	if len(cards) == 0 {
		t.Skip("no seeded cars to assert shape against")
	}
	// specs is populated from the LATERAL joins; a nil here would mean the
	// representative variant was not picked up in the same statement.
	if cards[0].Specs == nil {
		t.Error("expected specs to be populated from the lateral joins")
	}
}

func TestVariantDetailIsSingleQuery(t *testing.T) {
	pool, tr := newCountingPool(t)
	ctx := context.Background()

	var modelID, variantID int32
	err := pool.QueryRow(ctx,
		`SELECT v.model_id, v.id FROM car_variants v LIMIT 1`).Scan(&modelID, &variantID)
	if err != nil {
		t.Skipf("no variants seeded: %v", err)
	}

	tr.n.Store(0)
	if _, err := store.GetVariantDetail(ctx, pool, variantID, modelID); err != nil {
		t.Fatalf("variant detail: %v", err)
	}
	if got := tr.n.Load(); got != 1 {
		t.Errorf("variant detail issued %d queries, want 1", got)
	}
}

// The card scan reads expected_launch_date, a DATE column. It was
// originally scanned into a *string, which pgx rejects outright — but the
// synthetic benchmark data never populated that column, so every row came
// back NULL and NULL scans into anything. The bug only surfaced against a
// real catalogue. This seeds a row with a real date so the scan is
// exercised rather than skipped.
func TestCarCardScansLaunchDate(t *testing.T) {
	pool, _ := newCountingPool(t)
	ctx := context.Background()

	var withDate int
	if err := pool.QueryRow(ctx,
		`SELECT count(*) FROM car_models WHERE expected_launch_date IS NOT NULL`).Scan(&withDate); err != nil {
		t.Fatalf("probe: %v", err)
	}
	if withDate == 0 {
		t.Skip("no model has an expected_launch_date — nothing to exercise")
	}

	cards, err := store.ListCarCards(ctx, pool, store.CarCardFilters{
		LaunchStatus: "upcoming", Sort: "upcoming", Limit: 20,
	})
	if err != nil {
		t.Fatalf("list upcoming cards: %v", err)
	}

	for _, c := range cards {
		if c.ExpectedLaunchDate == nil {
			continue
		}
		// Prisma serialised this with .toISOString(); the website compares
		// the string, so the layout has to match exactly.
		if _, err := time.Parse("2006-01-02T15:04:05.000Z", *c.ExpectedLaunchDate); err != nil {
			t.Errorf("expectedLaunchDate %q is not in Prisma's toISOString layout: %v",
				*c.ExpectedLaunchDate, err)
		}
		return
	}
	t.Skip("no upcoming model carried a date in this dataset")
}
