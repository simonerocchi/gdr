-- +goose Up
-- +goose StatementBegin
create table schede (
    utente_id INTEGER,
    scheda JSONB,
    CONSTRAINT scheda_pkey PRIMARY KEY (utente_id),
    CONSTRAINT scheda_utenti FOREIGN KEY (utente_id) REFERENCES utenti(id) ON DELETE CASCADE
);
-- +goose StatementEnd
-- +goose StatementBegin
alter table utenti 
drop column scheda;
-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
alter table utenti 
add column scheda jsonb;
-- +goose StatementEnd
-- +goose StatementBegin
drop table schede;
-- +goose StatementEnd