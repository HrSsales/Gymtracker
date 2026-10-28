const express = require("express");
const router = express.Router();
const pool = require("../config/db");


// ==========================================
// LISTAR EXERCÍCIOS
// ==========================================

router.get("/:usuarioId", async (req, res) => {

    try {

        const { usuarioId } = req.params;

        const resultado = await pool.query(
            `
            SELECT
                e.id,
                e.nome,
                e.grupo_muscular,
                e.series,
                e.repeticoes,
                e.treino_id,
                t.nome AS treino_nome

            FROM exercicios e

            INNER JOIN treinos t
            ON e.treino_id = t.id

            WHERE t.usuario_id = $1

            ORDER BY e.id DESC
            `,
            [usuarioId]
        );

        res.json(resultado.rows);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao listar exercícios"
        });

    }

});


// ==========================================
// CADASTRAR EXERCÍCIO
// ==========================================

router.post("/", async (req, res) => {

    try {

        const {
            nome,
            grupo_muscular,
            series,
            repeticoes,
            treino_id
        } = req.body;

        if (
            !nome ||
            !grupo_muscular ||
            !series ||
            !repeticoes ||
            !treino_id
        ) {

            return res.status(400).json({
                erro: "Todos os campos são obrigatórios"
            });

        }

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
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )

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

        res.status(201).json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cadastrar exercício"
        });

    }

});


// ==========================================
// EDITAR EXERCÍCIO
// ==========================================

router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            nome,
            grupo_muscular,
            series,
            repeticoes
        } = req.body;

        const resultado = await pool.query(
            `
            UPDATE exercicios
            SET
                nome = $1,
                grupo_muscular = $2,
                series = $3,
                repeticoes = $4
            WHERE id = $5
            RETURNING *
            `,
            [
                nome,
                grupo_muscular,
                series,
                repeticoes,
                id
            ]
        );

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao atualizar exercício"
        });

    }

});


// ==========================================
// EXCLUIR EXERCÍCIO
// ==========================================

router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        await pool.query(
            `
            DELETE FROM exercicios
            WHERE id = $1
            `,
            [id]
        );

        res.json({
            mensagem: "Exercício removido com sucesso"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao excluir exercício"
        });

    }

});

module.exports = router;