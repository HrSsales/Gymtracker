const jwt = require("jsonwebtoken");

/* ==================================
   MIDDLEWARE DE AUTENTICAÇÃO
   Lê o header "Authorization: Bearer <token>",
   valida o JWT e coloca o usuário em req.usuario.
================================== */

function autenticar(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            erro: "Token não informado"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = {
            id: payload.id,
            nome: payload.nome,
            email: payload.email
        };

        next();

    } catch (erro) {

        return res.status(401).json({
            erro: "Token inválido ou expirado"
        });

    }
}

function gerarToken(usuario) {

    return jwt.sign(
        {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "8h"
        }
    );
}

module.exports = {
    autenticar,
    gerarToken
};
