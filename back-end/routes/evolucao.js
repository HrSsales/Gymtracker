const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { validarEvolucao, validarId } = require("../utils/validacoes");


// ==========================================
// FUNÇÃO AUXILIAR
// Confere se o exercício pertence ao usuário
// ==========================================

async function exercicioDoUsuario(exercicioId, usuarioId) {

    const resultado = await pool.query(
        `
        SELECT e.id
        FROM exercicios e
        INNER JOIN treinos t ON e.treino_id = t.id
        WHERE e.id = $1 AND t.usuario_id = $2
        `,
        [exercicioId, usuarioId]
    );

    return resultado.rows.length > 0;
}


// ==========================================
// LISTAR EVOLUÇÕES DO USUÁRIO LOGADO
// Regra de negócio: "diferenca" mostra quanto
// a carga subiu/caiu em relação ao registro
// anterior do mesmo exercício.
// Opcional: ?exercicio_id=1 para filtrar
// ==========================================

router.get("/", async (req, res) => {

    try {

        const { exercicio_id } = req.query;

        if (exercicio_id && validarId(exercicio_id)) {
            return res.status(400).json({
                erro: "Exercício inválido"
            });
        }

        const resultado = await pool.query(
            `
            SELECT *
            FROM (
                SELECT
                    ev.id,
                    ev.peso,
                    TO_CHAR(ev.data_registro, 'YYYY-MM-DD') AS data_registro,
                    ev.observacao,
                    ev.exercicio_id,
                    e.nome AS exercicio_nome,
                    t.nome AS treino_nome,
                    ev.peso - LAG(ev.peso) OVER (
                        PARTITION BY ev.exercicio_id
                        ORDER BY ev.data_registro, ev.id
                    ) AS diferenca
                FROM evolucao ev
                INNER JOIN exercicios e
                    ON ev.exercicio_id = e.id
                INNER JOIN treinos t
                    ON e.treino_id = t.id
                WHERE t.usuario_id = $1
            ) registros
            WHERE ($2::int IS NULL OR exercicio_id = $2::int)
            ORDER BY data_registro DESC, id DESC
            `,
            [req.usuario.id, exercicio_id || null]
        );

        res.json(resultado.rows);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao listar evolução"
        });

    }

});


// ==========================================
// CADASTRAR EVOLUÇÃO
// ==========================================

router.post("/", async (req, res) => {

    try {

        const erroValidacao = validarEvolucao(req.body);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const {
            peso,
            data_registro,
            exercicio_id
        } = req.body;

        const observacao = req.body.observacao?.trim() || null;

        if (!(await exercicioDoUsuario(exercicio_id, req.usuario.id))) {
            return res.status(404).json({
                erro: "Exercício não encontrado"
            });
        }

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
            RETURNING
                id,
                peso,
                TO_CHAR(data_registro, 'YYYY-MM-DD') AS data_registro,
                observacao,
                exercicio_id
            `,
            [
                peso,
                data_registro,
                observacao,
                exercicio_id
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao criar evolução"
        });

    }

});


// ==========================================
// EDITAR EVOLUÇÃO
// ==========================================

router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const erroValidacao =
            validarId(id) ||
            validarEvolucao(req.body);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const {
            peso,
            data_registro,
            exercicio_id
        } = req.body;

        const observacao = req.body.observacao?.trim() || null;

        if (!(await exercicioDoUsuario(exercicio_id, req.usuario.id))) {
            return res.status(404).json({
                erro: "Exercício não encontrado"
            });
        }

        const resultado = await pool.query(
            `
            UPDATE evolucao ev
            SET
                peso = $1,
                data_registro = $2,
                observacao = $3,
                exercicio_id = $4
            FROM exercicios e
            INNER JOIN treinos t ON e.treino_id = t.id
            WHERE ev.id = $5
            AND ev.exercicio_id = e.id
            AND t.usuario_id = $6
            RETURNING
                ev.id,
                ev.peso,
                TO_CHAR(ev.data_registro, 'YYYY-MM-DD') AS data_registro,
                ev.observacao,
                ev.exercicio_id
            `,
            [
                peso,
                data_registro,
                observacao,
                exercicio_id,
                id,
                req.usuario.id
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Registro não encontrado"
            });
        }

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao atualizar evolução"
        });

    }

});


// ==========================================
// EXCLUIR EVOLUÇÃO
// (antes esta rota estava DENTRO do POST,
// por isso nunca era registrada)
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
            DELETE FROM evolucao ev
            USING exercicios e, treinos t
            WHERE ev.id = $1
            AND ev.exercicio_id = e.id
            AND e.treino_id = t.id
            AND t.usuario_id = $2
            RETURNING ev.id
            `,
            [id, req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Registro não encontrado"
            });
        }

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

module.exports = router;
