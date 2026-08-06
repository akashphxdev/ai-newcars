package cache

import (
	"context"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache struct {
	rdb *redis.Client
}

func New(url string) (*Cache, error) {
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	// Redis is a best-effort accelerator here, never a dependency — short
	// timeouts mean a slow or wedged Redis degrades to a database read
	// instead of holding the request open.
	opt.DialTimeout = 2 * time.Second
	opt.ReadTimeout = 500 * time.Millisecond
	opt.WriteTimeout = 500 * time.Millisecond
	opt.PoolSize = 20

	return &Cache{rdb: redis.NewClient(opt)}, nil
}

func (c *Cache) Ping(ctx context.Context) error {
	return c.rdb.Ping(ctx).Err()
}

func (c *Cache) Close() error { return c.rdb.Close() }

func (c *Cache) Get(ctx context.Context, key string) ([]byte, bool) {
	b, err := c.rdb.Get(ctx, key).Bytes()
	if err != nil {
		if err != redis.Nil {
			slog.Warn("cache read skipped", "err", err, "key", key)
		}
		return nil, false
	}
	return b, true
}

func (c *Cache) Set(ctx context.Context, key string, val []byte, ttl time.Duration) {
	if err := c.rdb.Set(ctx, key, val, ttl).Err(); err != nil {
		slog.Warn("cache write skipped", "err", err, "key", key)
	}
}

// InvalidatePrefix clears every cached response under a path prefix.
// SCAN rather than KEYS so a large keyspace does not block the Redis
// event loop while an admin write is being served.
func (c *Cache) InvalidatePrefix(ctx context.Context, prefix string) error {
	var cursor uint64
	for {
		keys, next, err := c.rdb.Scan(ctx, cursor, prefix+"*", 200).Result()
		if err != nil {
			return err
		}
		if len(keys) > 0 {
			if err := c.rdb.Del(ctx, keys...).Err(); err != nil {
				return err
			}
		}
		if next == 0 {
			return nil
		}
		cursor = next
	}
}
