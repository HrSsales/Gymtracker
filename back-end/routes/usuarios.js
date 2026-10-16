const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const router = express.Router();

router.post("/", async (req, res) => {

    try {

        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                erro: "Todos os campos são obrigatórios"
            });
        }

        const usuarioExistente = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [email]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({
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