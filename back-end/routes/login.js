const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { gerarToken } = require("../middleware/auth");
const { validarLogin } = require("../utils/validacoes");

const router = express.Router();

/* ==================================
   LOGIN (DEVOLVE O TOKEN JWT)
================================== */

router.post("/", async (req, res) => {

    try {

        const erroValidacao = validarLogin(req.body);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const email = req.body.email.trim().toLowerCase();
        const { senha } = req.body;

        const resultado = await pool.query(
            "SELECT id, nome, email, senha FROM usuarios WHERE email = $1",
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                erro: "Email ou senha inválidos"
            });
        }

        const usuario = resultado.rows[0];

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaValida) {
            return res.status(401).json({
                erro: "Email ou senha inválidos"
            });
        }

        const token = gerarToken(usuario);

        res.status(200).json({
            sucesso: true,
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor"
        });
    }

});

module.exports = router;
