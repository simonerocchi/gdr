package model

import "bitbucket.org/leonardoce/idcrypt/pkg/idcrypt"

type Sessione struct {
	ID                        string
	*idcrypt.CredentialRecord `json:"-"`
	UtenteID                  int
	Utente                    *Utente
}

func (s *Sessione) TableName() string {
	return "sessioni"
}
