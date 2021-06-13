package model

import (
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/Mind-Informatica-srl/restapi/pkg/models"
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
func (m Messaggio) Process() (Messaggio, error) {
	if m.Tipo == "CHAT" {
		t := m.Content["Testo"]
		if t == nil {
			return m, nil
		}
		text := t.(string)
		if strings.HasPrefix(text, "/roll ") {
			dice := strings.Split(text, "/roll ")[1]
			var nd int
			var err error
			if nd, err = strconv.Atoi(dice); err != nil {
				m.Content["Testo"] = text + " non è un tiro valido"
				return m, err
			}
			res := []int{}
			for i := 0; i < nd; i += 1 {
				r := rand.Intn(6) + 1
				res = append(res, r)
				if r == 6 {
					r = rand.Intn(6) + 1
					res = append(res, r)
				}
			}
			m.Content["Dice"] = res
		}
	}
	return m, nil
}
