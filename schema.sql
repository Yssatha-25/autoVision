Create table usuarios(
    id serial primary key,
    nome varchar(100) not null,
    usuario varchar(100) not null,
    senha varchar(6) not null,
    telefone varchar(20) not null,
    foto_perfil varchar(100)
);

create table anuncios(
    id serial primary key,
    titulo varchar(100) not null,
    localidade varchar(100) not null,
    preco numeric (10,2) not null,
    imagem varchar(100) not null,
    vendedor_id integer not null references usuarios(id),
    criado_em timestamp default now()
);

create table interesses(
    id serial primary key,
    anuncio_id integer not null references anuncios(id),
    cliente_nome varchar(100) not null,
    cliente_contato varchar(255) not null,
    criado_em timestamp default now()
);

create table mensagens(
    id serial primary key,
    anuncio_id integer not null references anuncios(id),
    cliente_nome varchar(100) not null,
    cliente_contato varchar(255) not null,
    criado_em timestamp default now(), 
    mensagem text not null
);