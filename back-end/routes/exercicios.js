const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const {
    validarExercicio,
    validarId,
    GRUPOS_MUSCULARES
} = require("../utils/validacoes");


// ==========================================
// FUNÇÃO AUXILIAR
// Confere se o treino pertence ao usuário
// ==========================================

async function treinoDoUsuario(treinoId, usuarioId) {

    const resultado = await pool.query(
        "SELECT id FROM treinos WHERE id = $1 AND usuario_id = $2",
        [treinoId, usuarioId]
    );

    return resultado.rows.length > 0;
}


// ==========================================
// GRUPOS MUSCULARES ACEITOS
// ==========================================

router.get("/grupos", (req, res) => {

    res.json(GRUPOS_MUSCULARES);

});


// ==========================================
// LISTAR EXERCÍCIOS
// Opcional: ?treino_id=1 para filtrar
// ==========================================

router.get("/", async (req, res) => {

    try {

        const { treino_id } = req.query;

        if (treino_id && validarId(treino_id)) {
            return res.status(400).json({
                erro: "Treino inválido"
            });
        }

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
            AND ($2::int IS NULL OR e.treino_id = $2::int)

            ORDER BY e.id DESC
            `,
            [req.usuario.id, treino_id || null]
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

        const erroValidacao = validarExercicio(req.body);

        if (erroValidacao) {

            return res.status(400).json({
                erro: erroValidacao
            });

        }

        const {
            grupo_muscular,
            series,
            repeticoes,
            treino_id
        } = req.body;

        const nome = req.body.nome.trim();

        // Não deixa cadastrar exercício no treino de outra pessoa
        if (!(await treinoDoUsuario(treino_id, req.usuario.id))) {
            return res.status(404).json({
                erro: "Treino não encontrado"
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

        const erroValidacao =
            validarId(id) ||
            validarExercicio(req.body);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const {
            grupo_muscular,
            series,
            repeticoes,
            treino_id
        } = req.body;

        const nome = req.body.nome.trim();

        if (!(await treinoDoUsuario(treino_id, req.usuario.id))) {
            return res.status(404).json({
                erro: "Treino não encontrado"
            });
        }

        // Só atualiza se o exercício for de um treino do usuário
        const resultado = await pool.query(
            `
            UPDATE exercicios e
            SET
                nome = $1,
                grupo_muscular = $2,
                series = $3,
                repeticoes = $4,
                treino_id = $5
            FROM treinos t
            WHERE e.id = $6
            AND e.treino_id = t.id
            AND t.usuario_id = $7
            RETURNING e.*
            `,
            [
                nome,
                grupo_muscular,
                series,
                repeticoes,
                treino_id,
                id,
                req.usuario.id
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Exercício não encontrado"
            });
        }

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

        const erroId = validarId(id);

        if (erroId) {
            return res.status(400).json({
                erro: erroId
            });
        }

        const resultado = await pool.query(
            `
            DELETE FROM exercicios e
            USING treinos t
            WHERE e.id = $1
            AND e.treino_id = t.id
            AND t.usuario_id = $2
            RETURNING e.id
            `,
            [id, req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Exercício não encontrado"
            });
        }

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
