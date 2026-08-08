package store

import "testing"

func card(brandID int32, name string) CarCard {
	c := CarCard{Name: name}
	c.Brand.ID = brandID
	return c
}

func names(cs []CarCard) []string {
	out := make([]string, len(cs))
	for i, c := range cs {
		out[i] = c.Name
	}
	return out
}

func eq(t *testing.T, got []string, want ...string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("got %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("got %v, want %v", got, want)
		}
	}
}

func TestRoundRobinByBrand(t *testing.T) {
	t.Run("breaks up a clump", func(t *testing.T) {
		// The real case: five Volvos then a VinFast filled a row of six.
		in := []CarCard{
			card(1, "EX40"), card(1, "EC40"), card(1, "EX30"),
			card(1, "XC60"), card(1, "XC90"), card(2, "VF MPV 7"),
		}
		eq(t, names(roundRobinByBrand(in, 6)),
			"EX40", "VF MPV 7", "EC40", "EX30", "XC60", "XC90")
	})

	t.Run("keeps each brand's own order", func(t *testing.T) {
		in := []CarCard{card(1, "a1"), card(1, "a2"), card(2, "b1"), card(2, "b2")}
		eq(t, names(roundRobinByBrand(in, 4)), "a1", "b1", "a2", "b2")
	})

	t.Run("already diverse is left alone", func(t *testing.T) {
		in := []CarCard{card(1, "a"), card(2, "b"), card(3, "c")}
		eq(t, names(roundRobinByBrand(in, 3)), "a", "b", "c")
	})

	t.Run("honours the limit", func(t *testing.T) {
		in := []CarCard{card(1, "a1"), card(1, "a2"), card(2, "b1")}
		eq(t, names(roundRobinByBrand(in, 2)), "a1", "b1")
	})

	t.Run("nothing to do", func(t *testing.T) {
		if got := roundRobinByBrand(nil, 4); len(got) != 0 {
			t.Fatalf("expected empty, got %v", names(got))
		}
	})
}
