-- ==========================================
-- GYMTRACKER - SCRIPT DE CRIAÇÃO DO BANCO
-- PostgreSQL
--
-- Uso:
--   CREATE DATABASE gymtracker;
--   \c gymtracker
--   \i database/schema.sql
-- ==========================================

-- Apaga na ordem inversa das dependências
-- (permite rodar o script de novo do zero)
DROP TABLE IF EXISTS evolucao;
DROP TABLE IF EXISTS exercicios;
DROP TABLE IF EXISTS treinos;
DROP TABLE IF EXISTS usuarios;

-- ==========================================
-- USUÁRIOS
-- ==========================================

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,          -- hash bcrypt, nunca texto puro
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_usuarios_nome
        CHECK (LENGTH(TRIM(nome)) > 0),

    CONSTRAINT ck_usuarios_email
        CHECK (email = LOWER(email) AND email LIKE '%_@_%._%')
);

-- ==========================================
-- TREINOS (1 usuário -> N treinos)
-- ==========================================

CREATE TABLE treinos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    usuario_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_treinos_nome
        CHECK (LENGTH(TRIM(nome)) > 0)
);

-- ==========================================
-- EXERCÍCIOS (1 treino -> N exercícios)
-- ==========================================

CREATE TABLE exercicios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    grupo_muscular VARCHAR(50) NOT NULL,
    series INTEGER NOT NULL,
    repeticoes INTEGER NOT NULL,
    treino_id INTEGER NOT NULL,

    CONSTRAINT fk_treino
        FOREIGN KEY (treino_id)
        REFERENCES treinos(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_exercicios_series
        CHECK (series BETWEEN 1 AND 20),

    CONSTRAINT ck_exercicios_repeticoes
        CHECK (repeticoes BETWEEN 1 AND 100)
);

-- ==========================================
-- EVOLUÇÃO (1 exercício -> N registros de carga)
-- ==========================================

CREATE TABLE evolucao (
    id SERIAL PRIMARY KEY,
    peso DECIMAL(5,2) NOT NULL,
    data_registro DATE NOT NULL,
    observacao TEXT,
    exercicio_id INTEGER NOT NULL,

    CONSTRAINT fk_exercicio
        FOREIGN KEY (exercicio_id)
        REFERENCES exercicios(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_evolucao_peso
        CHECK (peso >= 0)
);

-- ==========================================
-- ÍNDICES (deixam as buscas por dono mais rápidas)
-- ==========================================

CREATE INDEX idx_treinos_usuario ON treinos(usuario_id);
CREATE INDEX idx_exercicios_treino ON exercicios(treino_id);
CREATE INDEX idx_evolucao_exercicio ON evolucao(exercicio_id, data_registro);
