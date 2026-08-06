package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Env         string
	Port        int
	DatabaseURL string
	RedisURL    string
	CORSOrigins []string
	JWTSecret   string
	JWTExpiry   time.Duration

	// Bounds the pgx pool. Kept well under Postgres' max_connections
	// because this service runs multiple replicas behind the load
	// balancer and each one holds its own pool.
	DBMaxConns int32
	DBMinConns int32
}

func Load() (*Config, error) {
	// Same .env the Node backend reads — during the strangler migration
	// both services share one file so DATABASE_URL/REDIS_URL can never
	// drift apart between them.
	_ = godotenv.Load(".env", "../.env", "../admin-backend/.env")

	c := &Config{
		Env:         getEnv("NODE_ENV", "development"),
		Port:        getEnvInt("GO_PORT", 5001),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		DBMaxConns:  int32(getEnvInt("DB_MAX_CONNS", 25)),
		DBMinConns:  int32(getEnvInt("DB_MIN_CONNS", 5)),
	}

	if c.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	normalized, err := normalizeDatabaseURL(c.DatabaseURL)
	if err != nil {
		return nil, err
	}
	c.DatabaseURL = normalized
	if c.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	for _, o := range strings.Split(getEnv("CORS_ORIGIN", ""), ",") {
		if o = strings.TrimSpace(o); o != "" {
			c.CORSOrigins = append(c.CORSOrigins, o)
		}
	}

	// Mirrors the Node backend's JWT_EXPIRES_IN so tokens minted by
	// either service stay interchangeable during cutover.
	c.JWTExpiry = parseDuration(getEnv("JWT_EXPIRES_IN", "7d"), 7*24*time.Hour)

	return c, nil
}

func (c *Config) IsProd() bool { return c.Env == "production" }

// normalizeDatabaseURL rewrites the Prisma-flavoured DATABASE_URL into
// one libpq understands, so both backends can read the same .env instead
// of maintaining two connection strings that could drift to different
// databases.
//
// Prisma accepts several parameters libpq rejects outright: `schema`
// (its name for search_path) and the `connection_limit`/`pool_timeout`
// pair, which describe Prisma's own pool and have no server-side
// meaning. pgx's pool size comes from DB_MAX_CONNS instead.
func normalizeDatabaseURL(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return "", fmt.Errorf("parse DATABASE_URL: %w", err)
	}

	q := u.Query()
	if schema := q.Get("schema"); schema != "" {
		q.Del("schema")
		if q.Get("search_path") == "" {
			q.Set("search_path", schema)
		}
	}
	q.Del("connection_limit")
	q.Del("pool_timeout")
	q.Del("pgbouncer")

	u.RawQuery = q.Encode()
	return u.String(), nil
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getEnvInt(k string, def int) int {
	if v, err := strconv.Atoi(os.Getenv(k)); err == nil {
		return v
	}
	return def
}

// Accepts the "7d"/"24h" shorthand used in the Node .env, which
// time.ParseDuration itself does not understand.
func parseDuration(s string, def time.Duration) time.Duration {
	if strings.HasSuffix(s, "d") {
		if n, err := strconv.Atoi(strings.TrimSuffix(s, "d")); err == nil {
			return time.Duration(n) * 24 * time.Hour
		}
	}
	if d, err := time.ParseDuration(s); err == nil {
		return d
	}
	return def
}
