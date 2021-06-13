package v1

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/Mind-Informatica-srl/restapi/pkg/actions"
	"github.com/Mind-Informatica-srl/restapi/pkg/controllers"
	"github.com/simoneroc/gdr/internal/configuration"
	"github.com/simoneroc/gdr/internal/model"
	"gorm.io/gorm"

	"bitbucket.org/leonardoce/idcrypt/pkg/idcrypt"
	"bitbucket.org/leonardoce/idcrypt/pkg/otp"
)

// AuthenticationError is raised when the authentication procedure
// has detected invalid data
type AuthenticationError struct {
	Reason string `json:"reason"`
}

// NewAuthenticationError return a new AuthenticationError
func NewAuthenticationError(reason string) AuthenticationError {
	return AuthenticationError{
		Reason: reason,
	}
}

func (a AuthenticationError) Error() string {
	return fmt.Sprintf("authentication error: %v", a.Reason)
}

var (
	// ErrMissingUsername is raised when the code is looking for an user
	// who doesn't exist
	ErrMissingUsername = fmt.Errorf("user is unknown")
)

type loginCandidate struct {
	Username *string
	Password *string
}

// AuthenticationManager is implemented by repositories that
// can load users
type AuthenticationManager interface {
	// FindUserByName load an user given a certain user name
	FindUserByName(username string, utente *model.Utente) error

	// CheckCredentials check if the password is the right one for a
	// certain user given the plaintext
	CheckCredentials(utente *model.Utente, password string) (bool, error)
}

type databaseAuthenticationManager struct {
	db *gorm.DB
}

func newDatabaseAuthenticationManager() *databaseAuthenticationManager {
	db := configuration.Current().DB
	return &databaseAuthenticationManager{
		db: db,
	}
}

func (loader *databaseAuthenticationManager) FindUserByName(username string, utente *model.Utente) error {
	return loader.db.Where("email = ?", username).
		First(&utente).Error
}

func (loader *databaseAuthenticationManager) CheckCredentials(utente *model.Utente, password string) (bool, error) {
	return utente.IsPasswordValid(password)
}

func authenticate(candidate loginCandidate, user *model.Utente, manager AuthenticationManager) error {
	// TODO: avoid overwriting parameters when a simple return will do

	// se candidate non ha username oppure non ha uno fra uniqueID e tempPassword restituisco errore
	if candidate.Username == nil {
		return NewAuthenticationError("Username mancante")
	}
	if candidate.Password == nil {
		return NewAuthenticationError("password mancante")
	}
	// recupero l'utente dal db
	if err := manager.FindUserByName(*candidate.Username, user); err != nil {
		return err
	}
	if valid, err := manager.CheckCredentials(user, *candidate.Password); err != nil {
		return err
	} else if !valid {
		return NewAuthenticationError("username o password errati")
	}
	return nil
}

var loginAction = actions.Action{
	Method:   "POST",
	Path:     "",
	SkipAuth: true,
	ActionFunc: func(w http.ResponseWriter, r *http.Request) *actions.ActionError {
		// recupero il candidate dalla request
		var candidate loginCandidate

		if reqBody, err := ioutil.ReadAll(r.Body); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusBadRequest}
		} else if err = json.Unmarshal(reqBody, &candidate); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		// lo autentico
		var user model.Utente
		if err := authenticate(candidate, &user, newDatabaseAuthenticationManager()); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusBadRequest}
		}
		// creo il token jwt
		// genero la coppia di credenziali per la sessione
		idSessione := otp.CreateRandomSecret()
		passwordSessione := otp.CreateRandomSecret()
		// creo la sessione
		mk := user.MasterKey
		cr, err := idcrypt.NewCredentialRecord(passwordSessione, mk)
		if err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		sessione := model.Sessione{
			ID:               idSessione,
			CredentialRecord: cr,
			UtenteID:         user.ID,
		}
		db := configuration.Current().DB
		err = db.Create(&sessione).Error
		if err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		// confeziono il token
		var t string
		if t, err = configuration.Current().JwtEngine.CreateJWT(idSessione, passwordSessione); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		user.JwtToken = &t
		// invio la riposta
		if err := json.NewEncoder(w).Encode(user); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError, Data: user}
		}
		return nil
	},
}

var loginController = controllers.NewController("/login", []actions.AbstractAction{
	&loginAction,
})
