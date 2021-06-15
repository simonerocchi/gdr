package v1

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"strconv"

	"bitbucket.org/leonardoce/idcrypt/pkg/idcrypt"
	"github.com/gorilla/mux"
	"github.com/simoneroc/gdr/internal/model"

	"github.com/Mind-Informatica-srl/restapi/pkg/actions"
	"github.com/Mind-Informatica-srl/restapi/pkg/controllers"
	"github.com/Mind-Informatica-srl/restapi/pkg/models"
	"gorm.io/gorm"

	"github.com/simoneroc/gdr/internal/configuration"
)

var utentiDelegate = models.NewBaseDelegate(
	func() *gorm.DB {
		return configuration.Current().DB
	},
	func() models.PKModel {
		return &model.Utente{}
	},
	func() interface{} {
		return &[]*model.Utente{}
	},
	func(r *http.Request) (interface{}, error) {
		return actions.PrimaryKeyIntExtractor(r, "id")
	},
)

var utentiInsertAction = actions.Action{
	Path:   "",
	Method: "POST",
	ActionFunc: func(w http.ResponseWriter, r *http.Request) *actions.ActionError {
		//recupero l'utente loggato
		logged := r.Context().Value(AuthUserContextKey).(*model.Utente)
		//recupero la masterkey
		mk := logged.MasterKey
		//recupero l'utente da inserire
		var element model.Utente
		reqBody, err := ioutil.ReadAll(r.Body)
		if err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusBadRequest}
		}

		if err = json.Unmarshal(reqBody, &element); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		//creo il credentialrecord
		cr, err := idcrypt.NewCredentialRecord(element.Email, mk)
		if err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError, Data: element}
		}
		element.CredentialRecord = cr
		//salvo l'utente
		db := configuration.Current().DB
		if err := db.Create(&element).Error; err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError, Data: element}
		}
		w.WriteHeader(http.StatusCreated)

		if err := json.NewEncoder(w).Encode(element); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError, Data: element}
		}
		return nil
	},
}

var utentiGetAllAction = actions.DBGetAllAction{
	Delegate: utentiDelegate,
}

var utentiGetOneAction = actions.DBGetOneAction{
	Delegate: utentiDelegate,
	Path:     "/{id}",
}

var utentiUpdateAction = actions.DBUpdateAction{
	Delegate: utentiDelegate,
	Path:     "/{id}",
}

var utentiDeleteAction = actions.DBDeleteAction{
	Delegate: utentiDelegate,
	Path:     "/{id}",
}

type passwordChage struct {
	OldP string
	NewP string
}

var cambiaPasswordAction = actions.Action{
	Method: "POST",
	Path:   "/pwd",
	ActionFunc: func(w http.ResponseWriter, r *http.Request) *actions.ActionError {
		var user = r.Context().Value(AuthUserContextKey).(*model.Utente)
		// recupero le password
		var pwd passwordChage
		reqBody, err := ioutil.ReadAll(r.Body)
		if err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusBadRequest}
		}
		if err = json.Unmarshal(reqBody, &pwd); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		// verifico la vecchia password
		if ok, err := user.IsPasswordValid(pwd.OldP); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		} else if !ok {
			return &actions.ActionError{Err: errors.New("password non corrispondente"), Status: http.StatusBadRequest}
		}
		// creo le nuove credenziali
		var cr *idcrypt.CredentialRecord
		if cr, err = idcrypt.NewCredentialRecord(pwd.NewP, user.MasterKey); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		user.CredentialRecord = cr
		//salvo le nuove credenziali
		db := configuration.Current().DB
		if err := db.Save(&user).Error; err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		if err := json.NewEncoder(w).Encode(user); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError, Data: user}
		}
		w.WriteHeader(http.StatusOK)
		return nil
	},
}

var resetPasswordAction = actions.Action{
	Method: "POST",
	Path:   "/reset/{id}",
	ActionFunc: func(w http.ResponseWriter, r *http.Request) *actions.ActionError {
		var user = r.Context().Value(AuthUserContextKey).(*model.Utente)
		// recupero l'id
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusBadRequest}
		}
		// recupero l'utente
		db := configuration.Current().DB
		element := model.Utente{ID: id}
		if err := db.First(&element).Error; err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}

		}
		// creo le nuove con password=username e scadute
		var cr *idcrypt.CredentialRecord
		if cr, err = idcrypt.NewCredentialRecord(element.Email, user.MasterKey); err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		element.CredentialRecord = cr
		//salvo le nuove credenziali
		if err := db.Save(&user).Error; err != nil {
			return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
		}
		w.WriteHeader(http.StatusOK)
		return nil
	},
}

var utentiController = controllers.NewController("/utenti", []actions.AbstractAction{
	&utentiGetAllAction,
	&utentiGetOneAction,
	&utentiInsertAction,
	&utentiUpdateAction,
	&utentiDeleteAction,
	&cambiaPasswordAction,
	&resetPasswordAction,
})
