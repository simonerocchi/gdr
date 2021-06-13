// Package v1 contain the code to configure the lamicolor server
package v1

import (
	"net/http"

	"github.com/Mind-Informatica-srl/restapi/pkg/actions"
	"github.com/Mind-Informatica-srl/restapi/pkg/server"
	"github.com/gorilla/mux"
	"github.com/simoneroc/gdr/internal/ws"
)

// createServer return the lamicolor server
func createServer() server.RestApiServer {
	router := mux.NewRouter().StrictSlash(true)
	server := server.NewRestApiServer(
		router,
		"/api/v1",
		jwtHandler,
		func(next http.Handler, authorizations []string) http.Handler {
			return next
		},
		AuthUserContextKey,
	)
	var serveWsAction = actions.Action{
		Path:       "/ws/{id}",
		Method:     "GET",
		ActionFunc: ws.ServeWs,
		SkipAuth:   true,
	}
	server.RegisterAction("", &serveWsAction)
	server.RegisterController(&utentiController)
	server.RegisterController(&loginController)
	server.RegisterController(&messaggiController)
	return server
}
