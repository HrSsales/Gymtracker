/* ==================================
   VALIDAÇÕES (REGRAS DE NEGÓCIO)
   Funções puras: recebem os dados e
   retornam a mensagem de erro ou null.
   Assim podem ser testadas sem banco.
================================== */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GRUPOS_MUSCULARES = [
    "Peito",
    "Costas",
    "Ombros",
    "Bíceps",
    "Tríceps",
    "Pernas",
    "Glúteos",
    "Abdômen",
    "Panturrilha",
    "Antebraço",
    "Corpo inteiro"
];

function textoValido(valor) {
    return typeof valor === "string" && valor.trim().length > 0;
}

function inteiroPositivo(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0;
}

function validarId(id) {

    if (!inteiroPositivo(id)) {
        return "ID inválido";
    }

    return null;
}

function validarEmail(email) {

    if (!textoValido(email) || !EMAIL_REGEX.test(email.trim())) {
        return "Email inválido";
    }

    if (email.length > 150) {
        return "Email deve ter no máximo 150 caracteres";
    }

    return null;
}

function validarSenha(senha) {

    if (typeof senha !== "string" || senha.length < 6) {
        return "A senha deve ter pelo menos 6 caracteres";
    }

    if (senha.length > 72) {
        return "A senha deve ter no máximo 72 caracteres";
    }

    return null;
}

function validarNome(nome, campo = "Nome", maximo = 100) {

    if (!textoValido(nome)) {
        return `${campo} é obrigatório`;
    }

    if (nome.trim().length > maximo) {
        return `${campo} deve ter no máximo ${maximo} caracteres`;
    }

    return null;
}

function validarCadastroUsuario({ nome, email, senha } = {}) {

    if (!nome || !email || !senha) {
        return "Todos os campos são obrigatórios";
    }

    return (
        validarNome(nome) ||
        validarEmail(email) ||
        validarSenha(senha)
    );
}

function validarLogin({ email, senha } = {}) {

    if (!textoValido(email) || !textoValido(senha)) {
        return "Email e senha são obrigatórios";
    }

    return null;
}

function validarTreino({ nome, descricao } = {}) {

    const erroNome = validarNome(nome, "Nome do treino");

    if (erroNome) {
        return erroNome;
    }

    if (descricao && typeof descricao !== "string") {
        return "Descrição inválida";
    }

    if (descricao && descricao.length > 500) {
        return "Descrição deve ter no máximo 500 caracteres";
    }

    return null;
}

function validarExercicio({
    nome,
    grupo_muscular,
    series,
    repeticoes,
    treino_id
} = {}) {

    if (!nome || !grupo_muscular || !series || !repeticoes || !treino_id) {
        return "Todos os campos são obrigatórios";
    }

    const erroNome = validarNome(nome, "Nome do exercício");

    if (erroNome) {
        return erroNome;
    }

    if (!GRUPOS_MUSCULARES.includes(grupo_muscular)) {
        return "Grupo muscular inválido";
    }

    if (!inteiroPositivo(series) || Number(series) > 20) {
        return "Séries deve ser um número inteiro entre 1 e 20";
    }

    if (!inteiroPositivo(repeticoes) || Number(repeticoes) > 100) {
        return "Repetições deve ser um número inteiro entre 1 e 100";
    }

    if (!inteiroPositivo(treino_id)) {
        return "Treino inválido";
    }

    return null;
}

function validarEvolucao({
    peso,
    data_registro,
    observacao,
    exercicio_id
} = {}) {

    if (peso === undefined || peso === null || peso === "" || !data_registro || !exercicio_id) {
        return "Peso, data e exercício são obrigatórios";
    }

    const pesoNumero = Number(peso);

    if (Number.isNaN(pesoNumero) || pesoNumero < 0 || pesoNumero > 999.99) {
        return "Peso deve ser um número entre 0 e 999.99";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data_registro)) {
        return "Data deve estar no formato AAAA-MM-DD";
    }

    const data = new Date(`${data_registro}T00:00:00`);

    // mesmaDataLocal pega datas impossíveis, como 2026-02-31
    if (Number.isNaN(data.getTime()) || !mesmaDataLocal(data, data_registro)) {
        return "Data inválida";
    }

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    if (data > hoje) {
        return "A data não pode estar no futuro";
    }

    if (observacao && typeof observacao !== "string") {
        return "Observação inválida";
    }

    if (observacao && observacao.length > 300) {
        return "Observação deve ter no máximo 300 caracteres";
    }

    if (!inteiroPositivo(exercicio_id)) {
        return "Exercício inválido";
    }

    return null;
}

function mesmaDataLocal(data, texto) {

    const [ano, mes, dia] = texto.split("-").map(Number);

    return (
        data.getFullYear() === ano &&
        data.getMonth() + 1 === mes &&
        data.getDate() === dia
    );
}

module.exports = {
    GRUPOS_MUSCULARES,
    validarId,
    validarEmail,
    validarSenha,
    validarNome,
    validarCadastroUsuario,
    validarLogin,
    validarTreino,
    validarExercicio,
    validarEvolucao
};
