/* ==========================================
   COMUNICAÇÃO COM A API
   Todas as páginas usam este arquivo para
   falar com o back-end. O token JWT vai
   automaticamente no header Authorization.
========================================== */

const API_URL = "http://localhost:3000";

function getToken() {
    return localStorage.getItem("token");
}

function salvarSessao(token, usuario) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuarioLogado", usuario.nome);
    localStorage.setItem("usuarioId", usuario.id);
}

function limparSessao() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("usuarioId");
}

// Páginas internas chamam isto logo no começo
function exigirLogin() {

    if (!getToken()) {
        window.location.replace("login.html");
        return false;
    }

    return true;
}

// Coloca o nome do usuário no botão de perfil do topo
function mostrarNomeUsuario() {

    const alvo = document.getElementById("boasVindas");
    const nome = localStorage.getItem("usuarioLogado");

    if (alvo && nome) {
        alvo.textContent = nome.split(" ")[0];
    }
}

function sair() {
    limparSessao();
    window.location.href = "index.html";
}

async function api(caminho, opcoes = {}) {

    const headers = {
        "Content-Type": "application/json",
        ...(opcoes.headers || {})
    };

    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let resposta;

    try {

        resposta = await fetch(`${API_URL}${caminho}`, {
            ...opcoes,
            headers,
            body: opcoes.body !== undefined
                ? JSON.stringify(opcoes.body)
                : undefined
        });

    } catch (erro) {

        throw new Error("Não foi possível conectar com o servidor.");

    }

    const dados = await resposta.json().catch(() => ({}));

    // Token venceu ou é inválido: volta para o login
    if (resposta.status === 401 && token && !caminho.startsWith("/login")) {
        limparSessao();
        window.location.replace("login.html");
    }

    if (!resposta.ok) {
        throw new Error(dados.erro || "Algo deu errado. Tente novamente.");
    }

    return dados;
}

// Evita que textos digitados pelo usuário virem HTML (XSS)
function escaparHTML(texto) {

    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function dataHojeISO() {

    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

// "2026-10-29" -> "29/10/2026" (sem problema de fuso horário)
function formatarData(dataISO) {

    if (!dataISO) return "--";

    const [ano, mes, dia] = dataISO.slice(0, 10).split("-");

    return `${dia}/${mes}/${ano}`;
}
