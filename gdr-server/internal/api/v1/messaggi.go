package v1

import (
	"net/http"

	"github.com/Mind-Informatica-srl/restapi/pkg/actions"
	"github.com/Mind-Informatica-srl/restapi/pkg/controllers"
	"github.com/Mind-Informatica-srl/restapi/pkg/models"
	"github.com/simoneroc/gdr/internal/configuration"
	"github.com/simoneroc/gdr/internal/model"
	"gorm.io/gorm"
)

var messaggiDelegate = models.NewBaseDelegate(
	func() *gorm.DB {
		return configuration.Current().DB
	},
	func() models.PKModel {
		return &model.Messaggio{}
	},
	func() interface{} {
		return &[]*model.Messaggio{}
	},
	func(r *http.Request) (interface{}, error) {
		return actions.PrimaryKeyIntExtractor(r, "id")
	},
)

var messaggiGetAll = actions.DBGetAllAction{
	Delegate: messaggiDelegate,
	ScopeDB: func(r *http.Request) (func(*gorm.DB) *gorm.DB, error) {
		looged := r.Context().Value(AuthUserContextKey).(*model.Utente)
		return func(d *gorm.DB) *gorm.DB {
			return d.Preload("Utente").Where("dest = ?", looged.ID)
		}, nil
	},
}

var messaggiController = controllers.NewController("/messaggi", []actions.AbstractAction{
	&messaggiGetAll,
})
