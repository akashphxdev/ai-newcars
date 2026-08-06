package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

// Only these many variants ship with the first detail payload; the rest
// come from the dedicated variants endpoint when the page expands them.
const variantOptionsPreviewLimit = 5

// Fuel codes to labels, matching FUEL_TYPE_LABELS in the Node services.
var fuelTypeLabels = map[int32]string{
	1: "Petrol", 2: "Diesel", 3: "CNG", 4: "LPG", 5: "Hybrid",
}

func fuelLabel(code *int32) *string {
	if code == nil {
		return nil
	}
	if l, ok := fuelTypeLabels[*code]; ok {
		return &l
	}
	return nil
}

// ListAllCars backs "/new-cars?type=…" — the paginated view-all of a
// homepage rail, same filter rules as the rail itself.
func (h *Handler) ListAllCars(w http.ResponseWriter, r *http.Request) {
	typ := qEnum(r, "type", "latest", "latest", "popular", "upcoming", "electric")
	page := qInt(r, "page", 1, 1, 1<<30)
	limit := qInt(r, "limit", 12, 1, 48)

	f := store.CarCardFilters{Limit: limit, Offset: (page - 1) * limit}
	switch typ {
	case "upcoming":
		f.LaunchStatus, f.Sort = "upcoming", "upcoming"
	case "electric":
		f.LaunchStatus, f.Sort, f.OnlyElectric = "available", "latest", true
	case "popular":
		f.LaunchStatus, f.Sort, f.RequireVariants = "available", "popular", true
	default:
		f.LaunchStatus, f.Sort, f.RequireVariants = "available", "latest", true
	}

	cars, err := store.ListCarCards(r.Context(), h.DB, f)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	total, err := store.CountCarCards(r.Context(), h.DB, f)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	httpx.Paginated(w, cars, httpx.NewPagination(page, limit, total), "Cars fetched successfully")
}

type browseResult struct {
	Cars       []store.CarCard    `json:"cars"`
	Pagination httpx.Pagination   `json:"pagination"`
	Filters    store.BrowseFacets `json:"filters"`
}

// BrowseCars backs the un-scoped "/new-cars" browse page.
//
// The Node version issued eleven queries per request: the page, a count,
// two for brand facets, two for body-type facets, four fuel counts and a
// price aggregate. This runs three — page, count, and one CTE statement
// covering every facet — and none of them touch car_variants.
func (h *Handler) BrowseCars(w http.ResponseWriter, r *http.Request) {
	page := qInt(r, "page", 1, 1, 1<<30)
	limit := qInt(r, "limit", 12, 1, 48)

	f := store.CarCardFilters{
		LaunchStatus:  qEnum(r, "launchStatus", "available", "available", "upcoming"),
		BrandSlugs:    qCommaList(r, "brand"),
		BodyTypeSlugs: qCommaList(r, "bodyType"),
		FuelTypes:     qCommaListIn(r, "fuelType", "petrol", "diesel", "cng", "electric"),
		MinPrice:      qDecimal(r, "minPrice"),
		MaxPrice:      qDecimal(r, "maxPrice"),
		Sort:          qEnum(r, "sort", "popularity", "popularity", "price-asc", "price-desc", "rating"),
		Limit:         limit,
		Offset:        (page - 1) * limit,
	}
	// "popularity" is the API's name for what the query layer calls
	// "popular" (rating, then recency).
	if f.Sort == "popularity" {
		f.Sort = "popular"
	}
	// Upcoming models are variant-less teasers by design, so the
	// has-a-variant gate only applies to available ones.
	f.RequireVariants = f.LaunchStatus == "available"

	cars, err := store.ListCarCards(r.Context(), h.DB, f)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	total, err := store.CountCarCards(r.Context(), h.DB, f)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	facets, err := store.GetBrowseFacets(r.Context(), h.DB, f)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	httpx.Success(w, browseResult{
		Cars:       cars,
		Pagination: httpx.NewPagination(page, limit, total),
		Filters:    *facets,
	}, "Cars fetched successfully")
}

type variantOption struct {
	ID          int32  `json:"id"`
	VariantName string `json:"variantName"`
	Price       string `json:"price"`
	IsTopSeller bool   `json:"isTopSeller"`
}

type featureItem struct {
	ID    int32   `json:"id"`
	Name  string  `json:"name"`
	Value *string `json:"value"`
}

type featureGroup struct {
	CategoryID   *int32        `json:"categoryId"`
	CategoryName string        `json:"categoryName"`
	Items        []featureItem `json:"items"`
}

type carImage struct {
	ID        int32   `json:"id"`
	ImageURL  string  `json:"imageUrl"`
	IsPrimary bool    `json:"isPrimary"`
	Angle     *string `json:"angle"`
	ColorID   *int32  `json:"colorId"`
}

type colorShade struct {
	ColorHex  string `json:"colorHex"`
	SortOrder int32  `json:"sortOrder"`
}

type carColor struct {
	ID             int32        `json:"id"`
	ColorName      string       `json:"colorName"`
	ImageURL       *string      `json:"imageUrl"`
	AdditionalCost *string      `json:"additionalCost"`
	Shades         []colorShade `json:"shades"`
}

func (h *Handler) CarDetail(w http.ResponseWriter, r *http.Request) {
	brandSlug := chi.URLParam(r, "brandSlug")
	modelSlug := chi.URLParam(r, "modelSlug")

	car, err := h.Q.GetCarModelBySlug(r.Context(), store.GetCarModelBySlugParams{
		ModelSlug: modelSlug, BrandSlug: brandSlug,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound(`Car "`+brandSlug+"/"+modelSlug+`" not found`))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	// Same rule the listings enforce: an available model with no variants
	// is not public yet, so a guessed or indexed URL must 404 too.
	if car.LaunchStatus == "available" && car.VariantCount == 0 {
		httpx.Fail(w, r, httpx.NotFound(`Car "`+brandSlug+"/"+modelSlug+`" not found`))
		return
	}

	opts, err := h.Q.ListVariantOptions(r.Context(), store.ListVariantOptionsParams{
		ModelID: car.ID, Lim: variantOptionsPreviewLimit,
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	variantOptions := make([]variantOption, 0, len(opts))
	for _, v := range opts {
		variantOptions = append(variantOptions, variantOption{
			ID: v.ID, VariantName: v.VariantName,
			Price: decStrReq(v.Price), IsTopSeller: v.IsTopSeller,
		})
	}

	images, err := h.carImages(r, car.ID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	colors, err := h.carColors(r, car.ID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	chosen := qIntPtr(r, "variant")
	if chosen == nil && len(opts) > 0 {
		chosen = &opts[0].ID
	}

	var selected any
	if chosen != nil {
		selected, err = h.selectedVariant(r, car.ID, *chosen)
		if err != nil {
			httpx.Fail(w, r, err)
			return
		}
	}

	var bodyType any
	if car.BodyTypeID != nil {
		bodyType = map[string]any{
			"id": *car.BodyTypeID, "name": *car.BodyTypeName, "slug": *car.BodyTypeSlug,
		}
	}

	httpx.Success(w, map[string]any{
		"id": car.ID, "name": car.Name, "slug": car.Slug,
		"brand": map[string]any{
			"id": car.BrandID, "name": car.BrandName,
			"slug": car.BrandSlug, "logoUrl": car.BrandLogoUrl,
		},
		"bodyType":           bodyType,
		"launchStatus":       car.LaunchStatus,
		"expectedLaunchDate": isoTime(car.ExpectedLaunchDate),
		"priceMin":           decStr(car.PriceMin),
		"priceMax":           decStr(car.PriceMax),
		"ratingAvg":          decStr(car.RatingAvg),
		"coverImageUrl":      car.CoverImageUrl,
		"variantOptions":     variantOptions,
		"variantCount":       car.VariantCount,
		"selectedVariant":    selected,
		"images":             images,
		"colors":             colors,
	}, "Car detail fetched successfully")
}

func (h *Handler) selectedVariant(r *http.Request, modelID, variantID int32) (any, error) {
	v, err := store.GetVariantDetail(r.Context(), h.DB, variantID, modelID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, httpx.BadRequest("Invalid variant for this car")
		}
		return nil, err
	}

	features, err := h.Q.ListVariantFeatures(r.Context(), variantID)
	if err != nil {
		return nil, err
	}

	var ice any
	if v.HasICE {
		ice = map[string]any{
			"fuelType":               fuelLabel(v.FuelType),
			"fuelTypeSubCategory":    v.FuelTypeSubCategory,
			"fuelTankCapacity":       decStr(v.FuelTankCapacity),
			"cngTankCapacity":        decStr(v.CngTankCapacity),
			"kerbWeight":             v.KerbWeight,
			"engineDisplacement":     decStr(v.EngineDisplacement),
			"cubicCapacity":          v.CubicCapacity,
			"cylinders":              v.Cylinders,
			"numGears":               v.NumGears,
			"isFourByFour":           v.IsFourByFour,
			"drivetrain":             v.IceDrivetrainName,
			"powerPs":                v.IcePowerPs,
			"powerMinRpm":            v.PowerMinRpm,
			"powerMaxRpm":            v.PowerMaxRpm,
			"torqueNm":               v.IceTorqueNm,
			"torqueMinRpm":           v.TorqueMinRpm,
			"torqueMaxRpm":           v.TorqueMaxRpm,
			"claimedFe":              decStr(v.ClaimedFe),
			"realWorldMileage":       decStr(v.RealWorldMileage),
			"topSpeedKmph":           v.IceTopSpeedKmph,
			"topSpeedTimeSec":        decStr(v.IceTopSpeedTimeSec),
			"emissionNormCompliance": v.IceEmissionNorm,
			"turboCharger":           v.TurboCharger,
		}
	}

	var electric any
	if v.IsElectric {
		electric = map[string]any{
			"numMotors":                 v.NumMotors,
			"motorType":                 v.MotorType,
			"batteryCapacity":           decStr(v.BatteryCapacity),
			"batteryChemistry":          v.BatteryChemistry,
			"thermalManagementSystem":   v.ThermalManagementSystem,
			"drivetrain":                v.EvDrivetrainName,
			"powerPs":                   v.EvPowerPs,
			"torqueNm":                  v.EvTorqueNm,
			"claimedRange":              v.ClaimedRange,
			"realWorldRange":            v.RealWorldRange,
			"topSpeedKmph":              v.EvTopSpeedKmph,
			"topSpeedTimeSec":           decStr(v.EvTopSpeedTimeSec),
			"acChargingOutput":          decStr(v.AcChargingOutput),
			"acChargingTime":            decStr(v.AcChargingTime),
			"dcChargingOutput":          decStr(v.DcChargingOutput),
			"dcFastChargingTime":        v.DcFastChargingTime,
			"batteryWarrantyKm":         v.BatteryWarrantyKm,
			"batteryWarrantyYears":      v.BatteryWarrantyYears,
			"motorWarrantyKm":           v.MotorWarrantyKm,
			"motorWarrantyYears":        v.MotorWarrantyYears,
			"standardWarrantyKm":        v.StandardWarrantyKm,
			"standardWarrantyYears":     v.StandardWarrantyYears,
			"emissionNormCompliance":    v.EvEmissionNorm,
			"motorPowerKw":              decStr(v.MotorPowerKw),
			"chargingPort":              v.ChargingPort,
			"chargingOptionsRaw":        v.ChargingOptionsRaw,
			"regenerativeBraking":       v.RegenerativeBraking,
			"regenerativeBrakingLevels": v.RegenerativeBrakingLevels,
		}
	}

	return map[string]any{
		"id":              v.ID,
		"variantName":     v.VariantName,
		"price":           decStrReq(v.Price),
		"seatingCapacity": v.SeatingCapacity,
		"transmission":    v.TransmissionName,
		"isElectric":      v.IsElectric,
		"ice":             ice,
		"electric":        electric,
		"dimensions": map[string]any{
			"length":          v.LengthMm,
			"width":           v.WidthMm,
			"height":          v.HeightMm,
			"wheelBase":       v.WheelBaseMm,
			"groundClearance": v.GroundClearanceMm,
			"bootSpace":       v.BootSpaceLitres,
			"frontSuspension": v.FrontSuspension,
			"rearSuspension":  v.RearSuspension,
			"steeringType":    v.SteeringType,
			"frontBrakeType":  v.FrontBrakeType,
			"rearBrakeType":   v.RearBrakeType,
		},
		"features": groupFeatures(features),
	}, nil
}

// groupFeatures buckets a variant's flat feature rows by category. The
// query already returns them in category sort order, so a single pass
// preserves it; uncategorised features collect in a trailing "Other"
// group rather than being dropped.
func groupFeatures(rows []store.ListVariantFeaturesRow) []featureGroup {
	groups := []featureGroup{}
	pos := map[int32]int{}
	otherIdx := -1

	for _, row := range rows {
		item := featureItem{ID: row.FeatureID, Name: row.FeatureName, Value: row.Value}

		if row.CategoryID == nil {
			if otherIdx < 0 {
				groups = append(groups, featureGroup{
					CategoryID: nil, CategoryName: "Other", Items: []featureItem{},
				})
				otherIdx = len(groups) - 1
			}
			groups[otherIdx].Items = append(groups[otherIdx].Items, item)
			continue
		}

		i, ok := pos[*row.CategoryID]
		if !ok {
			groups = append(groups, featureGroup{
				CategoryID:   row.CategoryID,
				CategoryName: *row.CategoryName,
				Items:        []featureItem{},
			})
			i = len(groups) - 1
			pos[*row.CategoryID] = i
		}
		groups[i].Items = append(groups[i].Items, item)
	}

	return groups
}

func (h *Handler) carImages(r *http.Request, modelID int32) ([]carImage, error) {
	rows, err := h.Q.ListCarImages(r.Context(), modelID)
	if err != nil {
		return nil, err
	}
	out := make([]carImage, 0, len(rows))
	for _, i := range rows {
		out = append(out, carImage{i.ID, i.ImageUrl, i.IsPrimary, i.Angle, i.ColorID})
	}
	return out, nil
}

// carColors fetches the colours and their shades in two queries rather
// than one per colour, then stitches them together.
func (h *Handler) carColors(r *http.Request, modelID int32) ([]carColor, error) {
	rows, err := h.Q.ListCarColors(r.Context(), modelID)
	if err != nil {
		return nil, err
	}

	out := make([]carColor, 0, len(rows))
	ids := make([]int32, 0, len(rows))
	idx := make(map[int32]int, len(rows))
	for i, c := range rows {
		out = append(out, carColor{
			ID: c.ID, ColorName: c.ColorName, ImageURL: c.ImageUrl,
			AdditionalCost: decStr(c.AdditionalCost), Shades: []colorShade{},
		})
		ids = append(ids, c.ID)
		idx[c.ID] = i
	}
	if len(ids) == 0 {
		return out, nil
	}

	shades, err := h.Q.ListColorShades(r.Context(), ids)
	if err != nil {
		return nil, err
	}
	for _, s := range shades {
		if i, ok := idx[s.ColorID]; ok {
			out[i].Shades = append(out[i].Shades, colorShade{s.ColorHex, s.SortOrder})
		}
	}
	return out, nil
}

func (h *Handler) CarImages(w http.ResponseWriter, r *http.Request) {
	brandSlug := chi.URLParam(r, "brandSlug")
	modelSlug := chi.URLParam(r, "modelSlug")

	car, err := h.Q.GetCarImagesPage(r.Context(), store.GetCarImagesPageParams{
		ModelSlug: modelSlug, BrandSlug: brandSlug,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound(`Car "`+brandSlug+"/"+modelSlug+`" not found`))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	images, err := h.carImages(r, car.ID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	colors, err := h.carColors(r, car.ID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	httpx.Success(w, map[string]any{
		"name":   car.Name,
		"brand":  map[string]any{"name": car.BrandName, "slug": car.BrandSlug},
		"images": images,
		"colors": colors,
	}, "Car images fetched successfully")
}

func (h *Handler) CarFaqs(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListCarFaqs(r.Context(), store.ListCarFaqsParams{
		ModelSlug: chi.URLParam(r, "modelSlug"),
		BrandSlug: chi.URLParam(r, "brandSlug"),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, f := range rows {
		out = append(out, map[string]any{"id": f.ID, "question": f.Question, "answer": f.Answer})
	}
	httpx.Success(w, out, "Car FAQs fetched successfully")
}

func (h *Handler) CarArticles(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListCarArticles(r.Context(), store.ListCarArticlesParams{
		ModelSlug: chi.URLParam(r, "modelSlug"),
		BrandSlug: chi.URLParam(r, "brandSlug"),
		Lim:       int32(qInt(r, "limit", 6, 1, 24)),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]articleRecord, 0, len(rows))
	for _, a := range rows {
		out = append(out, articleRecord{
			ID: a.ID, Title: a.Title, Slug: a.Slug, Excerpt: a.Excerpt,
			CoverImageURL: a.CoverImageUrl, ReadTimeMinutes: a.ReadTimeMinutes,
			PublishedAt: isoTime(a.PublishedAt),
			Category:    articleCategory{a.CategoryID, a.CategoryName, a.CategorySlug},
			Author:      articleAuthor{a.AuthorID, a.AuthorName},
		})
	}
	httpx.Success(w, out, "Car articles fetched successfully")
}

func (h *Handler) CarVariants(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListVariantOptionsBySlug(r.Context(), store.ListVariantOptionsBySlugParams{
		ModelSlug: chi.URLParam(r, "modelSlug"),
		BrandSlug: chi.URLParam(r, "brandSlug"),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]variantOption, 0, len(rows))
	for _, v := range rows {
		out = append(out, variantOption{
			ID: v.ID, VariantName: v.VariantName,
			Price: decStrReq(v.Price), IsTopSeller: v.IsTopSeller,
		})
	}
	httpx.Success(w, out, "Car variants fetched successfully")
}

func (h *Handler) LookupModels(w http.ResponseWriter, r *http.Request) {
	brandID, err := requiredPositiveInt(r, "brandId")
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	rows, err := h.Q.ListModelsByBrand(r.Context(), brandID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, m := range rows {
		out = append(out, map[string]any{
			"id": m.ID, "name": m.Name, "slug": m.Slug,
			"priceMin": decStr(m.PriceMin), "priceMax": decStr(m.PriceMax),
		})
	}
	httpx.Success(w, out, "Models fetched successfully")
}

func (h *Handler) LookupVariants(w http.ResponseWriter, r *http.Request) {
	modelID, err := requiredPositiveInt(r, "modelId")
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	rows, err := store.ListVariantsByModel(r.Context(), h.DB, modelID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, v := range rows {
		// fuelType stays null for an electric variant — the Mileage
		// calculator uses that to decide which variants a fuel selection
		// should show.
		var fuel *string
		if !v.IsElectric {
			fuel = fuelLabel(v.FuelType)
		}
		out = append(out, map[string]any{
			"id": v.ID, "variantName": v.VariantName, "price": decStrReq(v.Price),
			"isElectric": v.IsElectric, "fuelType": fuel,
		})
	}
	httpx.Success(w, out, "Variants fetched successfully")
}
