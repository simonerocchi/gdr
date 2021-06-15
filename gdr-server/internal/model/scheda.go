package model

import "github.com/Mind-Informatica-srl/restapi/pkg/models"

type Scheda struct {
	UtenteID int `gorm:"primaryKey"`
	Scheda   *models.JSONB
}

func (s *Scheda) TableName() string {
	return "schede"
}

func (s *Scheda) SetPK(pk interface{}) error {
	id := pk.(int)
	s.UtenteID = id
	return nil
}
func (s *Scheda) VerifyPK(pk interface{}) (bool, error) {
	id := pk.(int)
	return s.UtenteID == id, nil
}
