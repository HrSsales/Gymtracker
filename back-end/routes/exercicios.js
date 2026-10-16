const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// LISTAR EXERCÍCIOS DO USUÁRIO
router.get("/:usuarioId", async (req, res) => {

    try {

        const { usuarioId } = req.params;

        const resultado = await pool.query(
            `
            SELECT
                exercicios.id,
                exercicios.nome,
                exercicios.grupo_muscular,
                exercicios.series,
                exercicios.repeticoes,
                exercicios.treino_id,
                treinos.nome AS treino_nome
            FROM exercicios
            INNER JOIN treinos
                ON exercicios.treino_id = treinos.id
            WHERE treinos.usuario_id = $1
            ORDER BY exercicios.id DESC
            `,
            [usuarioId]
        );

        res.json(resultado.rows);

    } catch (erro) {

        console.error("Erro ao listar exercícios:", erro);

        res.status(500).json({
            erro: "Erro ao listar exercícios"
        });

    }

});


// CADASTRAR EXERCÍCIO
router.post("/", async (req, res) => {

    try {

        const {
            nome,
            grupo_muscular,
            series,
            repeticoes,
            treino_id
        } = req.body;

        const resultado = await pool.query(
            `
            INSERT INTO exercicios
            (
                nome,
                grupo_muscular,
                series,
                repeticoes,
                treino_id
            )
            VALUES
            ($1,$2,$3,$4,$5)
            RETURNING *
            `,
            [
                nome,
                grupo_muscular,
                series,
                repeticoes,
                treino_id
            ]
        );

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error("Erro ao criar exercício:", erro);

        res.status(500).json({
            erro: "Erro ao criar exercício"
        });

    }

});

module.exports = router;