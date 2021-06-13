package v1

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/simoneroc/gdr/internal/configuration"
	"github.com/simoneroc/gdr/internal/model"
	"gorm.io/gorm"
)

type contextKey string

// AuthUserContextKey is the key you can use to retrieve the authenticated user from the request's context
const AuthUserContextKey contextKey = "AuthUserContextKey"

func jwtHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// recupero il token
		reqToken := r.Header.Get("Authorization")
		if reqToken == "" {
			http.Error(w, "Not autorized", 401)
			return
		}
		splitToken := strings.Split(reqToken, "Bearer ")
		token := splitToken[1]
		// parso le credenziali
		t, err := configuration.Current().JwtEngine.ParseJWT(token)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// recupero la sessione dal db
		// var log = r.Context().Value(mindlogger.LoggerContextKey).(*mindlogger.AppLogger)

		db := configuration.Current().DB
		sessione := model.Sessione{
			ID: t.Subject,
		}
		if err := db.Preload("Utente").First(&sessione).
			Error; errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		} else if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// verifico la password
		if valid, err := sessione.IsPasswordValid(t.SharedSecret); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else if !valid {
			http.Error(w, "sessione non valida", http.StatusInternalServerError)
			return
		}
		mk, err := sessione.RecoverMasterKey(t.SharedSecret)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		sessione.Utente.MasterKey = mk
		// lo aggiungo alla request in modo che possa essere utilizzato in seguito
		ctx := context.WithValue(r.Context(), AuthUserContextKey, sessione.Utente)
		r = r.WithContext(ctx)
		next.ServeHTTP(w, r)
	})
}
