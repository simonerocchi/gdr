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

var schedeDelegate = models.NewBaseDelegate(
	func() *gorm.DB {
		return configuration.Current().DB
	},
	func() models.PKModel {
		return &model.Scheda{}
	},
	func() interface{} {
		return &[]*model.Messaggio{}
	},
	func(r *http.Request) (interface{}, error) {
		return actions.PrimaryKeyIntExtractor(r, "id")
	},
)

var schedeController = controllers.CreateModelController("/schede", schedeDelegate)
