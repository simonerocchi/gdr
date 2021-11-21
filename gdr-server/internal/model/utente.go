package model

import (
	"github.com/Mind-Informatica-srl/idcrypt/pkg/idcrypt"
	"gorm.io/gorm"
)

// Utente is the model for the user
type Utente struct {
	ID                        int
	Nome                      string
	Email                     string
	*idcrypt.CredentialRecord `json:"-"`
	MasterKey                 []byte  `gorm:"-" json:"-"`
	JwtToken                  *string `gorm:"-"`
	IsMaster                  bool
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

// AfterUpdate controlla che non ci sia più di un master
func (u *Utente) AfterUpdate(tx *gorm.DB) (err error) {
	if u.IsMaster {
		var others []Utente
		if err = tx.Where("is_master = true and id <> ?", u.ID).Find(&others).Error; err != nil {
			return
		}
		for _, o := range others {
			o.IsMaster = false
			if err = tx.Save(&o).Error; err != nil {
				return
			}
		}
	}
	return
}
