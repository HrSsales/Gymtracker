const express = require("express");
const router = express.Router();
const pool = require("../config/db");


// LISTAR EVOLUÇÕES DO USUÁRIO
router.get("/:usuarioId", async (req, res) => {

    try {

        const { usuarioId } = req.params;

        const resultado = await pool.query(
            `
            SELECT
                evolucao.id,
                evolucao.peso,
                evolucao.data_registro,
                evolucao.observacao,
                exercicios.nome AS exercicio_nome

            FROM evolucao

            INNER JOIN exercicios
                ON evolucao.exercicio_id = exercicios.id

            INNER JOIN treinos
                ON exercicios.treino_id = treinos.id

            WHERE treinos.usuario_id = $1

            ORDER BY evolucao.data_registro DESC
            `,
            [usuarioId]
        );

        res.json(resultado.rows);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao listar evolução"
        });

    }

});


// CADASTRAR EVOLUÇÃO
router.post("/", async (req, res) => {

    try {

        const {
            peso,
            data_registro,
            observacao,
            exercicio_id
        } = req.body;

        const resultado = await pool.query(
            `
            INSERT INTO evolucao
            (
                peso,
                data_registro,
                observacao,
                exercicio_id
            )
            VALUES
            ($1,$2,$3,$4)
            RETURNING *
            `,
            [
                peso,
                data_registro,
                observacao,
                exercicio_id
            ]
        );

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao criar evolução"
        });

    }

});

module.exports = router;