-- +goose Up
-- +goose StatementBegin
alter table utenti add column is_master boolean;
-- +goose StatementEnd
-- +goose StatementBegin
update utenti set is_master = true where email = 'simonerocchi@gmail.com';
-- +goose StatementEnd
-- +goose StatementBegin
alter table sessioni
drop constraint sessioni_utenti;
-- +goose StatementEnd
-- +goose StatementBegin
alter table sessioni
add CONSTRAINT sessioni_utenti FOREIGN KEY (utente_id) REFERENCES utenti(id) on delete cascade;
-- +goose StatementEnd
-- +goose StatementBegin
alter table messaggi
drop constraint messaggi_utenti;
-- +goose StatementEnd
-- +goose StatementBegin
alter table messaggi
add CONSTRAINT messaggi_utenti FOREIGN KEY (utente_id) REFERENCES utenti(id) on delete cascade;
-- +goose StatementEnd


-- +goose Down
-- +goose StatementBegin
alter table messaggi
drop constraint messaggi_utenti;
-- +goose StatementEnd
-- +goose StatementBegin
alter table messaggi
add CONSTRAINT messaggi_utenti FOREIGN KEY (utente_id) REFERENCES utenti(id);
-- +goose StatementEnd
-- +goose StatementBegin
alter table sessioni
drop constraint sessioni_utenti;
-- +goose StatementEnd
-- +goose StatementBegin
alter table sessioni
add CONSTRAINT sessioni_utenti FOREIGN KEY (utente_id) REFERENCES utenti(id);
-- +goose StatementEnd
-- +goose StatementBegin
alter table utenti drop column is_master;
-- +goose StatementEnd
