// Package presselamicolor implement the root command of the project
package gdr

import (
	"os"
	"strconv"

	"github.com/Mind-Informatica-srl/restapi/pkg/logger"
	v1 "github.com/simoneroc/gdr/internal/api/v1"
	"github.com/simoneroc/gdr/internal/bootstrap"
	"github.com/simoneroc/gdr/internal/configuration"
	"github.com/spf13/cobra"
)

// NewCmd return the "presselamicolor" root command
func NewCmd() *cobra.Command {
	var pgDsn string
	var production bool

	cmd := cobra.Command{
		Use:  "gdr [cmd]",
		Long: "This is the GDR project",
		PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
			logger.Setup(production)
			var config *configuration.Data
			var err error

			if config, err = configuration.Create(pgDsn, production); err != nil {
				logger.Log().Error(err, "Cannot setup project configuration",
					"dsn", pgDsn)
				os.Exit(1)
				return err
			}

			if err = configuration.Setup(config); err != nil {
				return err
			}

			return nil
		},
	}
	cmd.AddCommand(v1.NewCmd())
	cmd.AddCommand(bootstrap.NewCmd())

	productionDefault, err := strconv.ParseBool(os.Getenv("PRODUCTION"))
	if err != nil {
		productionDefault = false
	}

	cmd.PersistentFlags().StringVar(
		&pgDsn,
		"pgdsn",
		os.Getenv("PGDSN"),
		"The postgresql database connection string, such as "+
			"'dbname=presselamicolor host=127.0.0.1', defaults to the PGDSN environment variable")
	cmd.PersistentFlags().BoolVar(
		&production,
		"production",
		productionDefault,
		"Configure the application in production mode, defaults to the PRODUCTION environment variable")

	return &cmd
}
