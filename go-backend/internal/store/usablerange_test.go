package store

import "testing"

func TestUsableRange(t *testing.T) {
	i := func(v int32) *int32 { return &v }

	t.Run("measured wins and is not flagged", func(t *testing.T) {
		got, est := usableRange(i(400), i(500))
		if *got != 400 || est {
			t.Fatalf("got %d estimated=%v, want 400 false", *got, est)
		}
	})

	t.Run("claimed is discounted and flagged", func(t *testing.T) {
		got, est := usableRange(nil, i(500))
		if *got != 350 || !est {
			t.Fatalf("got %d estimated=%v, want 350 true", *got, est)
		}
	})

	t.Run("rounds rather than truncates", func(t *testing.T) {
		// 457 * 0.70 = 319.9 — truncation would report 319.
		got, _ := usableRange(nil, i(457))
		if *got != 320 {
			t.Fatalf("got %d, want 320", *got)
		}
	})

	t.Run("neither figure means no range at all", func(t *testing.T) {
		got, est := usableRange(nil, nil)
		if got != nil || est {
			t.Fatal("expected nil range and no estimate flag")
		}
	})
}
