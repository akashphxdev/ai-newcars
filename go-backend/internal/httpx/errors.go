package httpx

import (
	"errors"
	"log/slog"
	"net/http"
)

// APIError mirrors the Node backend's ApiError class, including the
// response body shape produced by its errorHandler middleware.
type APIError struct {
	StatusCode int
	Message    string
	Details    any
}

func (e *APIError) Error() string { return e.Message }

func BadRequest(msg string, details ...any) *APIError {
	return newErr(http.StatusBadRequest, msg, "Bad Request", details...)
}
func Unauthorized(msg string) *APIError {
	return newErr(http.StatusUnauthorized, msg, "Unauthorized")
}
func Forbidden(msg string) *APIError {
	return newErr(http.StatusForbidden, msg, "Forbidden")
}
func NotFound(msg string) *APIError {
	return newErr(http.StatusNotFound, msg, "Not Found")
}
func Conflict(msg string) *APIError {
	return newErr(http.StatusConflict, msg, "Conflict")
}
func Internal(msg string) *APIError {
	return newErr(http.StatusInternalServerError, msg, "Internal Server Error")
}

func newErr(code int, msg, def string, details ...any) *APIError {
	if msg == "" {
		msg = def
	}
	e := &APIError{StatusCode: code, Message: msg}
	if len(details) > 0 {
		e.Details = details[0]
	}
	return e
}

// ValidationIssue matches the {path, message} objects the Node handler
// builds from a ZodError.
type ValidationIssue struct {
	Path    string `json:"path"`
	Message string `json:"message"`
}

type ValidationError struct{ Issues []ValidationIssue }

func (e *ValidationError) Error() string { return "Validation failed" }

// Fail is the single exit point for every handler error, standing in for
// Express's centralised errorHandler. Unexpected errors are logged with
// their detail and answered with a generic message — the same split the
// Node handler makes, so internals never reach a client.
func Fail(w http.ResponseWriter, r *http.Request, err error) {
	var ve *ValidationError
	if errors.As(err, &ve) {
		writeJSON(w, http.StatusBadRequest, map[string]any{
			"success": false,
			"message": "Validation failed",
			"errors":  ve.Issues,
		})
		return
	}

	var ae *APIError
	if errors.As(err, &ae) {
		body := map[string]any{"success": false, "message": ae.Message}
		if ae.Details != nil {
			body["details"] = ae.Details
		}
		writeJSON(w, ae.StatusCode, body)
		return
	}

	slog.Error("unhandled request error",
		"err", err, "method", r.Method, "path", r.URL.Path)
	writeJSON(w, http.StatusInternalServerError, map[string]any{
		"success": false,
		"message": "Something went wrong on our end",
	})
}

func NotFoundHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotFound, map[string]any{
		"success": false,
		"message": "Route not found: " + r.Method + " " + r.URL.RequestURI(),
	})
}
