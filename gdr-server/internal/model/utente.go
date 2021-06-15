package model

import (
	"bitbucket.org/leonardoce/idcrypt/pkg/idcrypt"
)

// Utente is the model for the user
type Utente struct {
	ID                        int
	Nome                      string
	Email                     string
	*idcrypt.CredentialRecord `json:"-"`
	MasterKey                 []byte  `gorm:"-" json:"-"`
	JwtToken                  *string `gorm:"-"`
}

// TableName return the users table name
func (u *Utente) TableName() string {
	return "utenti"
}

// SetPK set the pk for the model
func (u *Utente) SetPK(pk interface{}) error {
	u.ID = pk.(int)
	return nil
}

// VerifyPK check the pk value
func (u *Utente) VerifyPK(pk interface{}) (bool, error) {
	var id = pk.(int)
	return u.ID == id, nil
}
