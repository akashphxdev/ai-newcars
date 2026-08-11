package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

// The in-house ad server's public face. The admin panel has held
// advertisers, campaigns and placements for months with zero impressions
// and zero clicks recorded, because nothing on the website could ask for
// an ad — this is the missing half.
//
// Serving is a read; impressions and clicks are writes that must reach
// the database every time, so they are never cached and never batched.

type servedAd struct {
	CampaignID  int32  `json:"campaignId"`
	PlacementID int32  `json:"placementId"`
	Placement   string `json:"placement"`
	ImageURL    string `json:"imageUrl"`
	TargetURL   string `json:"targetUrl"`
	Name        string `json:"name"`
	Dimensions  string `json:"dimensions"`
}

type adEventBody struct {
	CampaignID   int32  `json:"campaignId"`
	PlacementID  int32  `json:"placementId"`
	ImpressionID *int64 `json:"impressionId"`
	PageURL      string `json:"pageUrl"`
	ReferrerURL  string `json:"referrerUrl"`
	DeviceType   string `json:"deviceType"`
	SessionID    string `json:"sessionId"`
}

// ServeAd answers with the campaign to show in one placement.
//
// An empty placement is a normal answer, not an error: most placements
// are unsold most of the time, and the slot renders its reserved box.
func (h *Handler) ServeAd(w http.ResponseWriter, r *http.Request) {
	slug := strings.ToLower(strings.TrimSpace(qStr(r, "placement")))
	if slug == "" || len(slug) > 100 {
		httpx.Fail(w, r, httpx.BadRequest("placement is required"))
		return
	}

	row, err := h.Q.ServeAdForPlacement(r.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Success(w, nil, "No ad for this placement")
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	httpx.Success(w, servedAd{
		CampaignID:  row.ID,
		PlacementID: row.PlacementID,
		Placement:   row.PlacementSlug,
		ImageURL:    row.CreativeImageUrl,
		TargetURL:   row.TargetUrl,
		Name:        row.Name,
		Dimensions:  row.Dimensions,
	}, "Ad fetched successfully")
}

// AdImpression records one rendered ad and returns the impression id, so
// a click can be tied back to the view that produced it.
func (h *Handler) AdImpression(w http.ResponseWriter, r *http.Request) {
	body, placementID, ok := h.readAdEvent(w, r)
	if !ok {
		return
	}

	id, err := h.Q.RecordAdImpression(r.Context(), store.RecordAdImpressionParams{
		CampaignID:  body.CampaignID,
		PlacementID: &placementID,
		PageUrl:     optStr(body.PageURL, 255),
		ReferrerUrl: optStr(body.ReferrerURL, 255),
		DeviceType:  optStr(body.DeviceType, 20),
		IpAddress:   clientIP(r),
		SessionID:   optStr(body.SessionID, 100),
		UserAgent:   truncPtr(r.UserAgent(), 255),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, map[string]any{"impressionId": id}, "Impression recorded")
}

// AdClick records a click. The browser sends this as the visitor is
// already navigating away, so it answers as soon as the row is written
// and carries nothing the caller needs to read.
func (h *Handler) AdClick(w http.ResponseWriter, r *http.Request) {
	body, placementID, ok := h.readAdEvent(w, r)
	if !ok {
		return
	}

	err := h.Q.RecordAdClick(r.Context(), store.RecordAdClickParams{
		CampaignID:   body.CampaignID,
		PlacementID:  &placementID,
		ImpressionID: body.ImpressionID,
		PageUrl:      optStr(body.PageURL, 255),
		ReferrerUrl:  optStr(body.ReferrerURL, 255),
		DeviceType:   optStr(body.DeviceType, 20),
		IpAddress:    clientIP(r),
		SessionID:    optStr(body.SessionID, 100),
		UserAgent:    truncPtr(r.UserAgent(), 255),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, nil, "Click recorded")
}

// Both events arrive from the browser, so the campaign is looked up and
// its own placement is used rather than the one the caller claims — a
// forged pairing would otherwise bill an advertiser for a slot their
// campaign never ran in.
func (h *Handler) readAdEvent(w http.ResponseWriter, r *http.Request) (adEventBody, int32, bool) {
	var body adEventBody
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4<<10)).Decode(&body); err != nil {
		httpx.Fail(w, r, httpx.BadRequest("Invalid request body"))
		return body, 0, false
	}
	if body.CampaignID <= 0 {
		httpx.Fail(w, r, httpx.BadRequest("campaignId is required"))
		return body, 0, false
	}

	row, err := h.Q.AdCampaignPlacement(r.Context(), body.CampaignID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("Campaign not found"))
			return body, 0, false
		}
		httpx.Fail(w, r, err)
		return body, 0, false
	}
	return body, row.PlacementID, true
}
