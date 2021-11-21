create table utenti (
    id serial,
    nome text not null,
    email text not null,
    encrypted_password text,
    encrypted_master_key text,
    encrypted_master_key_salt text,
    scheda jsonb,
    CONSTRAINT utenti_pkey PRIMARY KEY (id)
);

create table sessioni (
    id text,
    encrypted_password text,
    encrypted_master_key text,
    encrypted_master_key_salt text,
    utente_id int,
    CONSTRAINT sessioni_pkey PRIMARY KEY (id),
    CONSTRAINT sessioni_utenti FOREIGN KEY (utente_id) REFERENCES utenti(id)
);

create table messaggi (
    id serial,
    messaggio jsonb,
    data_ora timestamp without time zone,
    utente_id int,
    tipo text,
    constraint messaggi_pk primary key (id),
    constraint messaggi_utenti foreign key (utente_id) references utenti(id)
);