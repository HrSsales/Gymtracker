const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/* LISTAR TREINOS */

router.get("/:usuarioId", async (req, res) => {

    try {

        const { usuarioId } = req.params;

        const resultado = await pool.query(
            `
            SELECT *
            FROM treinos
            WHERE usuario_id = $1
            ORDER BY id DESC
            `,
            [usuarioId]
        );

        res.json(resultado.rows);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar treinos"
        });

    }

});

/* CRIAR TREINO */

router.post("/", async (req, res) => {

    console.log("BODY RECEBIDO:");
    console.log(req.body);

    try {

        const { nome, descricao, usuario_id } = req.body;

        console.log(nome);
        console.log(descricao);
        console.log(usuario_id);

        const resultado = await pool.query(
            `
            INSERT INTO treinos
            (nome, descricao, usuario_id)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [nome, descricao, usuario_id]
        );

        console.log("TREINO CRIADO");

        res.status(201).json(resultado.rows[0]);

    } catch (erro) {

        console.error("ERRO TREINOS:");
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao criar treino"
        });

    }

});
module.exports = router;