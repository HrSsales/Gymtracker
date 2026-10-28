const express = require("express");
const router = express.Router();
const pool = require("../config/db");


// LISTAR EVOLUÇÕES DO USUÁRIO
router.get("/:usuarioId", async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                evolucao.id,
                evolucao.peso,
                evolucao.data_registro,
                evolucao.observacao,
                exercicios.nome AS exercicio_nome
            FROM evolucao
            INNER JOIN exercicios
                ON evolucao.exercicio_id = exercicios.id
            ORDER BY evolucao.data_registro DESC
        `);

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

    router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        await pool.query(
            "DELETE FROM evolucao WHERE id = $1",
            [id]
        );

        res.json({
            mensagem: "Registro excluído com sucesso"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao excluir registro"
        });

    }

});

});

module.exports = router;