const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/:usuarioId", async (req, res) => {

    try {

        const { usuarioId } = req.params;

        const treinos = await pool.query(
            "SELECT COUNT(*) FROM treinos WHERE usuario_id = $1",
            [usuarioId]
        );

        const exercicios = await pool.query(
            `
            SELECT COUNT(*)
            FROM exercicios e
            INNER JOIN treinos t
            ON e.treino_id = t.id
            WHERE t.usuario_id = $1
            `,
            [usuarioId]
        );

        const evolucoes = await pool.query(
            "SELECT COUNT(*) FROM evolucao WHERE usuario_id = $1",
            [usuarioId]
        );

        res.json({
            treinos: treinos.rows[0].count,
            exercicios: exercicios.rows[0].count,
            evolucoes: evolucoes.rows[0].count
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao carregar estatísticas"
        });

    }

});

module.exports = router;