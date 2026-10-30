/* ==================================
   TRATAMENTO GLOBAL DE ERROS
================================== */

// Rota que não existe
function rotaNaoEncontrada(req, res) {

    res.status(404).json({
        erro: "Rota não encontrada"
    });
}

// Qualquer erro que não foi tratado nas rotas
// (ex: JSON mal formatado no corpo da requisição)
// eslint-disable-next-line no-unused-vars
function tratarErros(erro, req, res, next) {

    if (erro.type === "entity.parse.failed") {
        return res.status(400).json({
            erro: "JSON inválido no corpo da requisição"
        });
    }

    console.error(erro);

    res.status(500).json({
        erro: "Erro interno do servidor"
    });
}

module.exports = {
    rotaNaoEncontrada,
    tratarErros
};
