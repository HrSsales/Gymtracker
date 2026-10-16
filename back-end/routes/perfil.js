const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;

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
    [id]
);
``

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

module.exports = router;