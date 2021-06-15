package model

import (
	"strings"
	"time"

	"github.com/Mind-Informatica-srl/restapi/pkg/models"
	"github.com/simoneroc/gdr/internal/roll"
)

type Messaggio struct {
	ID       int
	Content  models.JSONB
	DataOra  *time.Time
	UtenteID int
	Tipo     string
	Utente   Utente
	Dest     int
}

func (m *Messaggio) TableName() string {
	return "messaggi"
}

// SetPK set the pk for the model
func (m *Messaggio) SetPK(pk interface{}) error {
	id := pk.(int)
	m.ID = id
	return nil
}

// VerifyPK check the pk value
func (m *Messaggio) VerifyPK(pk interface{}) (bool, error) {
	id := pk.(int)
	return m.ID == id, nil
}

// Process elaborate the messagge before sending
func (m *Messaggio) Process() error {
	if m.Tipo == "CHAT" {
		t := m.Content["Testo"]
		if t == nil {
			return nil
		}
		text := t.(string)
		if strings.HasPrefix(text, "/roll ") {
			res := []int{}
			var err error
			if res, err = roll.Roll(text); err != nil {
				m.Content["Testo"] = text + " non è un tiro valido"
				return err
			}
			m.Content["Dice"] = res
		}
	}
	return nil
}
