const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/* ==================================
   ESTATÍSTICAS DO USUÁRIO LOGADO
================================== */

router.get("/", async (req, res) => {

    try {

        const usuarioId = req.usuario.id;

        // A tabela evolucao não tem usuario_id:
        // chega no usuário passando por exercicios -> treinos
        const resultado = await pool.query(
            `
            SELECT
                (SELECT COUNT(*) FROM treinos WHERE usuario_id = $1) AS treinos,

                (SELECT COUNT(*)
                 FROM exercicios e
                 INNER JOIN treinos t ON e.treino_id = t.id
                 WHERE t.usuario_id = $1) AS exercicios,

                (SELECT COUNT(*)
                 FROM evolucao ev
                 INNER JOIN exercicios e ON ev.exercicio_id = e.id
                 INNER JOIN treinos t ON e.treino_id = t.id
                 WHERE t.usuario_id = $1) AS evolucoes
            `,
            [usuarioId]
        );

        const stats = resultado.rows[0];

        res.json({
            treinos: Number(stats.treinos),
            exercicios: Number(stats.exercicios),
            evolucoes: Number(stats.evolucoes)
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao carregar estatísticas"
        });

    }

});

module.exports = router;
