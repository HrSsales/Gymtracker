CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE treinos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    usuario_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

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
        ON DELETE CASCADE
);

CREATE TABLE evolucao (
    id SERIAL PRIMARY KEY,
    peso DECIMAL(5,2) NOT NULL,
    data_registro DATE NOT NULL,
    observacao TEXT,
    exercicio_id INTEGER NOT NULL,

    CONSTRAINT fk_exercicio
        FOREIGN KEY (exercicio_id)
        REFERENCES exercicios(id)
        ON DELETE CASCADE
);