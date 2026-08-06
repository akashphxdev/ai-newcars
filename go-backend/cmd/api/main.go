package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/timesauto/go-backend/internal/cache"
	"github.com/timesauto/go-backend/internal/config"
	"github.com/timesauto/go-backend/internal/database"
	"github.com/timesauto/go-backend/internal/handler"
	"github.com/timesauto/go-backend/internal/server"
)

func main() {
	if err := run(); err != nil {
		slog.Error("startup failed", "err", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	logLevel := slog.LevelDebug
	if cfg.IsProd() {
		logLevel = slog.LevelInfo
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel})))

	ctx := context.Background()

	pool, err := database.New(ctx, cfg.DatabaseURL, cfg.DBMaxConns, cfg.DBMinConns)
	if err != nil {
		return err
	}
	defer pool.Close()

	c, err := cache.New(cfg.RedisURL)
	if err != nil {
		return err
	}
	defer c.Close()

	// Redis is optional; a failed ping is logged and the service starts
	// anyway, serving uncached reads.
	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	if err := c.Ping(pingCtx); err != nil {
		slog.Warn("redis unavailable, running without cache", "err", err)
	}
	cancel()

	h := handler.New(pool, c, cfg)
	srv := &http.Server{
		Addr:    ":" + strconv.Itoa(cfg.Port),
		Handler: server.New(h, c, cfg),
		// Guards against slow-client connection exhaustion, which is the
		// failure mode that matters most for a public endpoint.
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		slog.Info("server listening", "port", cfg.Port, "env", cfg.Env)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-errCh:
		return err
	case sig := <-stop:
		slog.Info("shutting down", "signal", sig.String())
	}

	// Let in-flight requests finish before the process exits, so a deploy
	// does not turn into a burst of 502s.
	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancelShutdown()
	return srv.Shutdown(shutdownCtx)
}
