const express = require("express");
const pool = require("../config/db");
const { validarTreino, validarId } = require("../utils/validacoes");

const router = express.Router();

/* ==================================
   LISTAR TREINOS DO USUÁRIO LOGADO
================================== */

router.get("/", async (req, res) => {

    try {

        const resultado = await pool.query(
            `
            SELECT
                t.id,
                t.nome,
                t.descricao,
                t.created_at,
                COUNT(e.id)::int AS total_exercicios
            FROM treinos t
            LEFT JOIN exercicios e
                ON e.treino_id = t.id
            WHERE t.usuario_id = $1
            GROUP BY t.id
            ORDER BY t.id DESC
            `,
            [req.usuario.id]
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
   BUSCAR UM TREINO
================================== */

router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const erroId = validarId(id);

        if (erroId) {
            return res.status(400).json({
                erro: erroId
            });
        }

        const resultado = await pool.query(
            `
            SELECT *
            FROM treinos
            WHERE id = $1 AND usuario_id = $2
            `,
            [id, req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Treino não encontrado"
            });
        }

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar treino"
        });

    }

});

/* ==================================
   CRIAR TREINO
================================== */

router.post("/", async (req, res) => {

    try {

        const erroValidacao = validarTreino(req.body);

        if (erroValidacao) {

            return res.status(400).json({
                erro: erroValidacao
            });

        }

        const nome = req.body.nome.trim();
        const descricao = req.body.descricao?.trim() || null;

        // O dono do treino vem do token, não do corpo da requisição
        const usuario_id = req.usuario.id;

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

        const erroValidacao =
            validarId(id) ||
            validarTreino(req.body);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const nome = req.body.nome.trim();
        const descricao = req.body.descricao?.trim() || null;

        const resultado =
            await pool.query(
                `
                UPDATE treinos
                SET
                    nome = $1,
                    descricao = $2
                WHERE id = $3 AND usuario_id = $4
                RETURNING *
                `,
                [
                    nome,
                    descricao,
                    id,
                    req.usuario.id
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

        const erroId = validarId(id);

        if (erroId) {
            return res.status(400).json({
                erro: erroId
            });
        }

        const resultado =
            await pool.query(
                `
                DELETE FROM treinos
                WHERE id = $1 AND usuario_id = $2
                RETURNING *
                `,
                [id, req.usuario.id]
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
