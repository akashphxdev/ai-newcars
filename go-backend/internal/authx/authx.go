// Package authx issues and reads the site's user tokens.
//
// The tokens are the ones Node already mints: HS256 over {id, type} with
// the same secret and the same lifetime. That compatibility is the whole
// point — a visitor logged in before the cutover keeps their session
// afterwards, and either backend can verify the other's token while both
// are serving.
package authx

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Mirrors Node's AuthPayload. roleId is admin-only and never set for the
// public site, but it is carried so a token round-trips unchanged.
type Claims struct {
	ID     int32  `json:"id"`
	Type   string `json:"type"`
	RoleID *int32 `json:"roleId,omitempty"`
	jwt.RegisteredClaims
}

var ErrNoToken = errors.New("no token")

type Verifier struct {
	secret []byte
	expiry time.Duration
}

func New(secret string, expiry time.Duration) *Verifier {
	return &Verifier{secret: []byte(secret), expiry: expiry}
}

// Sign mints a token in the shape Node's signToken produces: the same two
// claims plus exp, so a token from either service is interchangeable.
func (v *Verifier) Sign(id int32, kind string) (string, error) {
	now := time.Now()
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		ID:   id,
		Type: kind,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(v.expiry)),
		},
	})
	return tok.SignedString(v.secret)
}

// Verify reads the bearer token from a request. The signing method is
// pinned to HMAC: without that check a token could arrive claiming "alg:
// none", or an RSA algorithm whose "public key" is our own secret.
func (v *Verifier) Verify(r *http.Request) (*Claims, error) {
	header := strings.TrimSpace(r.Header.Get("Authorization"))
	if header == "" {
		return nil, ErrNoToken
	}
	raw := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	if raw == "" {
		return nil, ErrNoToken
	}

	claims := &Claims{}
	_, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return v.secret, nil
	})
	if err != nil {
		return nil, err
	}
	return claims, nil
}

// UserID returns the signed-in user's id, or 0. Used where a request is
// better for being attributed but works fine without — a lead form filled
// in by someone who happens to be logged in.
func (v *Verifier) UserID(r *http.Request) *int32 {
	claims, err := v.Verify(r)
	if err != nil || claims.Type != "user" || claims.ID <= 0 {
		return nil
	}
	id := claims.ID
	return &id
}
