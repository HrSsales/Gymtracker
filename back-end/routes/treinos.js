const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/* ==================================
   LISTAR TREINOS
================================== */

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

/* ==================================
   CRIAR TREINO
================================== */

router.post("/", async (req, res) => {

    try {

        const {
            nome,
            descricao,
            usuario_id
        } = req.body;

        if (!nome || !usuario_id) {

            return res.status(400).json({
                erro: "Nome e usuário são obrigatórios"
            });

        }

        const resultado = await pool.query(
            `
            INSERT INTO treinos
            (
                nome,
                descricao,
                usuario_id
            )
            VALUES
            (
                $1,
                $2,
                $3
            )
            RETURNING *
            `,
            [
                nome,
                descricao,
                usuario_id
            ]
        );

        res.status(201).json(
            resultado.rows[0]
        );

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao criar treino"
        });

    }

});

/* ==================================
   EDITAR TREINO
================================== */

router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            nome,
            descricao
        } = req.body;

        const resultado =
            await pool.query(
                `
                UPDATE treinos
                SET
                    nome = $1,
                    descricao = $2
                WHERE id = $3
                RETURNING *
                `,
                [
                    nome,
                    descricao,
                    id
                ]
            );

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                erro: "Treino não encontrado"
            });

        }

        res.json(
            resultado.rows[0]
        );

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao atualizar treino"
        });

    }

});

/* ==================================
   EXCLUIR TREINO
================================== */

router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const resultado =
            await pool.query(
                `
                DELETE FROM treinos
                WHERE id = $1
                RETURNING *
                `,
                [id]
            );

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                erro: "Treino não encontrado"
            });

        }

        res.json({
            mensagem:
                "Treino excluído com sucesso"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao excluir treino"
        });

    }

});

module.exports = router;