const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { validarCadastroUsuario } = require("../utils/validacoes");

const router = express.Router();

/* ==================================
   CADASTRAR USUÁRIO
================================== */

router.post("/", async (req, res) => {

    try {

        const erroValidacao = validarCadastroUsuario(req.body);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const nome = req.body.nome.trim();
        const email = req.body.email.trim().toLowerCase();
        const { senha } = req.body;

        const usuarioExistente = await pool.query(
            "SELECT id FROM usuarios WHERE email = $1",
            [email]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({
                erro: "Email já cadastrado"
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const novoUsuario = await pool.query(
            `
            INSERT INTO usuarios
            (nome, email, senha)
            VALUES ($1, $2, $3)
            RETURNING id, nome, email
            `,
            [nome, email, senhaHash]
        );

        res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso",
            usuario: novoUsuario.rows[0]
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor"
        });
    }
});

module.exports = router;
