package model

import "github.com/Mind-Informatica-srl/idcrypt/pkg/idcrypt"

type Sessione struct {
	ID                        string
	*idcrypt.CredentialRecord `json:"-"`
	UtenteID                  int
	Utente                    *Utente
}

func (s *Sessione) TableName() string {
	return "sessioni"
}
