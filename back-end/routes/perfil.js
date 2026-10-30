const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { gerarToken } = require("../middleware/auth");
const {
    validarNome,
    validarEmail,
    validarSenha
} = require("../utils/validacoes");

const router = express.Router();

/* ==================================
   VER PERFIL DO USUÁRIO LOGADO
================================== */

router.get("/", async (req, res) => {

    try {

        const resultado = await pool.query(
            `
            SELECT
                id,
                nome,
                email,
                created_at
            FROM usuarios
            WHERE id = $1
            `,
            [req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Usuário não encontrado"
            });
        }

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor"
        });

    }

});

/* ==================================
   EDITAR PERFIL
   nome e email obrigatórios;
   para trocar a senha, mandar
   senha_atual + nova_senha
================================== */

router.put("/", async (req, res) => {

    try {

        const { nome, email, senha_atual, nova_senha } = req.body;

        const erroValidacao =
            validarNome(nome) ||
            validarEmail(email) ||
            (nova_senha ? validarSenha(nova_senha) : null);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const emailEmUso = await pool.query(
            "SELECT id FROM usuarios WHERE email = $1 AND id <> $2",
            [emailNormalizado, req.usuario.id]
        );

        if (emailEmUso.rows.length > 0) {
            return res.status(409).json({
                erro: "Email já cadastrado"
            });
        }

        let senhaHash = null;

        if (nova_senha) {

            if (!senha_atual) {
                return res.status(400).json({
                    erro: "Informe a senha atual para trocar a senha"
                });
            }

            const atual = await pool.query(
                "SELECT senha FROM usuarios WHERE id = $1",
                [req.usuario.id]
            );

            if (atual.rows.length === 0) {
                return res.status(404).json({
                    erro: "Usuário não encontrado"
                });
            }

            const senhaConfere = await bcrypt.compare(
                senha_atual,
                atual.rows[0].senha
            );

            if (!senhaConfere) {
                return res.status(403).json({
                    erro: "Senha atual incorreta"
                });
            }

            senhaHash = await bcrypt.hash(nova_senha, 10);
        }

        const resultado = await pool.query(
            `
            UPDATE usuarios
            SET
                nome = $1,
                email = $2,
                senha = COALESCE($3, senha)
            WHERE id = $4
            RETURNING id, nome, email, created_at
            `,
            [nome.trim(), emailNormalizado, senhaHash, req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Usuário não encontrado"
            });
        }

        const usuario = resultado.rows[0];

        // Token novo, porque nome/email fazem parte dele
        res.json({
            mensagem: "Perfil atualizado com sucesso",
            usuario,
            token: gerarToken(usuario)
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao atualizar perfil"
        });

    }

});

/* ==================================
   EXCLUIR CONTA
   Pede a senha para confirmar.
   Treinos, exercícios e evoluções
   saem juntos (ON DELETE CASCADE).
================================== */

router.delete("/", async (req, res) => {

    try {

        const { senha } = req.body || {};

        if (!senha) {
            return res.status(400).json({
                erro: "Informe sua senha para excluir a conta"
            });
        }

        const resultado = await pool.query(
            "SELECT senha FROM usuarios WHERE id = $1",
            [req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Usuário não encontrado"
            });
        }

        const senhaConfere = await bcrypt.compare(
            senha,
            resultado.rows[0].senha
        );

        if (!senhaConfere) {
            return res.status(403).json({
                erro: "Senha incorreta"
            });
        }

        await pool.query(
            "DELETE FROM usuarios WHERE id = $1",
            [req.usuario.id]
        );

        res.json({
            mensagem: "Conta excluída com sucesso"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao excluir conta"
        });

    }

});

module.exports = router;
