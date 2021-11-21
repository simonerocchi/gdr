// Package server implements the web server
package v1

import (
	"fmt"
	"net/http"
	"os"

	"github.com/spf13/cobra"
)

// NewCmd creates the "server" subcommand
func NewCmd() *cobra.Command {
	var listenAddresses string
	var sslCert string
	var sslKey string

	cmd := cobra.Command{
		Use:   "server [flags]",
		Short: "Start the web server",
		Long: `This command start the web server with the configuration
set in the command line flags. The server will stop its execution at
the end of the process, a.k.a. this is not a daemon process.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if listenAddresses == "" {
				fmt.Println("Empty listen addresses")
				os.Exit(1)
			}
			server := createServer()
			server.Router.PathPrefix("/").Handler(http.FileServer(http.Dir("/app/web")))
			if sslCert == "" || sslKey == "" {
				return http.ListenAndServe(listenAddresses, &server)
			} else {
				return http.ListenAndServeTLS(listenAddresses, sslCert, sslKey, &server)
			}
		},
		Args: cobra.ExactArgs(0),
	}

	cmd.Flags().StringVarP(
		&listenAddresses,
		"listen-addresses",
		"s",
		os.Getenv("LISTEN_ADDRESSES"),
		"the IP address and port where the server should accept connections, defaults "+
			"to the value in the LISTEN_ADDRESSES environment variable, i.e. ':8000'",
	)
	cmd.PersistentFlags().StringVar(
		&sslCert,
		"ssl-cert",
		os.Getenv("SSL_CERT"),
		"The ssl certificate address.")
	cmd.PersistentFlags().StringVar(
		&sslKey,
		"ssl-key",
		os.Getenv("SSL_KEY"),
		"The ssl key address.")

	return &cmd
}
