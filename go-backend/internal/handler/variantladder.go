package handler

import (
	"html"
	"sort"
	"strings"

	"github.com/timesauto/go-backend/internal/store"
)

// A trim ladder is only useful if it says what each rung buys you. The
// catalogue records that as one row per variant per feature, so the
// difference has to be derived.
//
// Two things make a naive diff unusable. "Not Available" is stored as a
// value rather than as an absent row, so a trim that lists a feature it
// does not have looks identical to one that has it. And a feature can
// simply have no row on the cheaper trim, which means the same thing. Both
// count as "does not have it".
func meaningfulFeature(v *string) bool {
	if v == nil {
		return false
	}
	s := strings.TrimSpace(strings.ToLower(*v))
	switch s {
	case "", "-", "no", "none", "not available", "na", "n/a", "false":
		return false
	}
	return true
}

// Values arrive HTML-escaped from the admin editor.
func cleanFeatureValue(v string) string {
	return strings.TrimSpace(html.UnescapeString(v))
}

// A label a reader recognises. "Touchscreen: 8 inch" beats either half
// alone, but "Alloy Wheels: Yes" is noise — the name already said it.
func featureLabel(name, value string) string {
	v := cleanFeatureValue(value)
	lower := strings.ToLower(v)
	if lower == "yes" || lower == "standard" || lower == "available" || v == "" {
		return name
	}
	// Where the value is a sentence in its own right the name is usually a
	// bucket like "Additional Features" and adds nothing.
	if len(v) > 24 && strings.Contains(v, " ") {
		return v
	}
	return name + ": " + v
}

type variantFeatureSet struct {
	variantID int32
	features  map[string]*string
}

// keyAdditionsByVariant returns, for each variant, up to three things it
// adds over the next-cheaper trim.
//
// Genuine additions rank above upgrades: gaining a reversing camera is
// more informative than a camera going from one resolution to another, and
// three lines is all the column has room for.
func keyAdditionsByVariant(rows []store.ModelVariantFeaturesRow) map[int32][]string {
	order := make([]variantFeatureSet, 0, 8)
	index := map[int32]int{}
	for _, r := range rows {
		i, ok := index[r.VariantID]
		if !ok {
			index[r.VariantID] = len(order)
			order = append(order, variantFeatureSet{variantID: r.VariantID, features: map[string]*string{}})
			i = len(order) - 1
		}
		order[i].features[r.FeatureName] = r.Value
	}

	out := map[int32][]string{}
	for i, cur := range order {
		if i == 0 {
			// The cheapest trim has nothing beneath it to add over.
			out[cur.variantID] = nil
			continue
		}
		prev := order[i-1]

		var additions, upgrades []string
		for name, val := range cur.features {
			if !meaningfulFeature(val) {
				continue
			}
			before, existed := prev.features[name]
			if !existed || !meaningfulFeature(before) {
				additions = append(additions, featureLabel(name, *val))
				continue
			}
			if cleanFeatureValue(*before) != cleanFeatureValue(*val) {
				upgrades = append(upgrades, featureLabel(name, *val))
			}
		}

		// Map iteration is unordered, so the same car would otherwise list
		// different features on each request.
		sort.Strings(additions)
		sort.Strings(upgrades)

		picked := append(additions, upgrades...)
		if len(picked) > 3 {
			picked = picked[:3]
		}
		out[cur.variantID] = picked
	}
	return out
}
