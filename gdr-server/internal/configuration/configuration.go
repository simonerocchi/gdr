// Package configuration contain the current configuration
// in use by the project
package configuration

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"time"

	"bitbucket.org/leonardoce/idcrypt/pkg/jwt"
	mindlogger "github.com/Mind-Informatica-srl/restapi/pkg/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Data contain all the configuration parameters
type Data struct {
	// DB is the used postgresql connection pool
	DB *gorm.DB
	// JwtEngine is the engine used to manage JWT tokens
	JwtEngine *jwt.Engine
}

// currentConfiguration is the default configuration
var currentConfiguration *Data

// ErrorAlreadySetup is raised when this project is started up
// more than one times
var ErrorAlreadySetup = fmt.Errorf("configuration already set")

// Setup create the current configuration.
func Setup(config *Data) error {
	if currentConfiguration != nil {
		return ErrorAlreadySetup
	}

	currentConfiguration = config
	return nil
}

// Current gets the current configurfation
func Current() *Data {
	return currentConfiguration
}

// Create create a configuration
func Create(pgDsn string, production bool) (*Data, error) {
	var err error
	config := &Data{}

	gormConfig := &gorm.Config{}

	if production {
		gormConfig.Logger = logger.Discard
	} else {
		gormConfig.Logger = logger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
			logger.Config{
				SlowThreshold:             time.Second, // Slow SQL threshold
				LogLevel:                  logger.Info, // Log level
				IgnoreRecordNotFoundError: true,        // Ignore ErrRecordNotFound error for logger
				Colorful:                  true,        // Enable color
			},
		)
	}

	if config.DB, err = gorm.Open(postgres.Open(pgDsn), gormConfig); err != nil {
		return nil, err
	}
	privateKey, err := ioutil.ReadFile("../crts/jwt/signing.key")
	if err != nil {
		mindlogger.Log().Info("../crts/jwt/signing.key not found")
	}
	publicKey, err := ioutil.ReadFile("../crts/jwt/signing.pub")
	if err != nil {
		mindlogger.Log().Info("../crts/jwt/signing.pub not found")
	}
	d, err := time.ParseDuration("24h")
	if err != nil {
		panic(err)
	}
	if len(privateKey) > 0 && len(publicKey) > 0 {
		jwtEngine, err := jwt.CreateEngine(privateKey, publicKey, d)
		if err != nil {
			panic(err)
		}

		config.JwtEngine = jwtEngine
	}

	return config, nil
}
