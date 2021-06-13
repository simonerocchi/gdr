package bootstrap

import (
	"bitbucket.org/leonardoce/idcrypt/pkg/idcrypt"
	"github.com/Mind-Informatica-srl/restapi/pkg/logger"
	"github.com/simoneroc/gdr/internal/configuration"
	"github.com/simoneroc/gdr/internal/model"
	"github.com/spf13/cobra"
)

// NewCmd creates the "bootstrap" subcommand
func NewCmd() *cobra.Command {

	cmd := cobra.Command{
		Use:   "bootstrap",
		Short: "Create the first user",
		Long:  `This command create the first user.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return bootstrap()
		},
		Args: cobra.ExactArgs(0),
	}

	return &cmd
}

func bootstrap() error {
	masterKey, err := idcrypt.GenerateMasterKey()
	if err != nil {
		logger.Log().Error(err, "error creating masterkey")
		return err
	}
	password := "04121978Sr!"
	credentialRecord, err := idcrypt.NewCredentialRecord(password, masterKey)
	if err != nil {
		logger.Log().Error(err, "error creating credentialRecord")
		return err
	}
	utente := model.Utente{
		Nome:             "simone",
		Email:            "simonerocchi@gmail.com",
		CredentialRecord: credentialRecord,
	}
	db := configuration.Current().DB
	if err = db.Create(&utente).Error; err != nil {
		logger.Log().Error(err, "error creating first user")
	}
	return nil
}
