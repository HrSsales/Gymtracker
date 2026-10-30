/* ==========================================
   MODAIS E AVISOS
   abrirFormulario -> modal com formulário
   confirmarAcao   -> modal de confirmação
   mostrarToast    -> aviso no canto da tela
========================================== */

/* ------------------------------------------
   TOAST
------------------------------------------ */

function mostrarToast(mensagem, tipo = "sucesso") {

    let area = document.querySelector(".toast-area");

    if (!area) {
        area = document.createElement("div");
        area.className = "toast-area";
        area.setAttribute("role", "status");
        area.setAttribute("aria-live", "polite");
        document.body.appendChild(area);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;

    area.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("visivel"));

    setTimeout(() => {
        toast.classList.remove("visivel");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* ------------------------------------------
   BASE DO MODAL
------------------------------------------ */

function criarModal({ titulo, perigo = false, conteudo }) {

    const fundo = document.createElement("div");
    fundo.className = "modal-fundo";

    fundo.innerHTML = `
        <div class="modal ${perigo ? "perigo" : ""}"
             role="dialog"
             aria-modal="true"
             aria-labelledby="modalTitulo">

            <div class="modal-topo">
                <h2 id="modalTitulo">${escaparHTML(titulo)}</h2>
                <button type="button" class="modal-fechar" aria-label="Fechar">×</button>
            </div>

            ${conteudo}

        </div>
    `;

    document.body.appendChild(fundo);
    document.body.classList.add("modal-ativo");

    requestAnimationFrame(() => fundo.classList.add("aberto"));

    const elementoAnterior = document.activeElement;

    let ocupado = false;
    let aoFechar = () => {};

    function fechar() {

        if (ocupado) return;

        document.removeEventListener("keydown", teclado);
        fundo.classList.remove("aberto");
        document.body.classList.remove("modal-ativo");

        setTimeout(() => fundo.remove(), 250);

        if (elementoAnterior) elementoAnterior.focus();

        aoFechar();
    }

    function teclado(evento) {

        if (evento.key === "Escape") {
            fechar();
        }

        // Mantém o TAB dentro do modal
        if (evento.key === "Tab") {

            const focaveis = fundo.querySelectorAll(
                "button, input, select, textarea"
            );

            const primeiro = focaveis[0];
            const ultimo = focaveis[focaveis.length - 1];

            if (evento.shiftKey && document.activeElement === primeiro) {
                evento.preventDefault();
                ultimo.focus();
            } else if (!evento.shiftKey && document.activeElement === ultimo) {
                evento.preventDefault();
                primeiro.focus();
            }
        }
    }

    document.addEventListener("keydown", teclado);

    fundo.querySelector(".modal-fechar").addEventListener("click", fechar);

    // Clicar fora do modal fecha
    fundo.addEventListener("mousedown", (evento) => {
        if (evento.target === fundo) fechar();
    });

    return {
        fundo,
        fechar,
        setOcupado(valor) {
            ocupado = valor;
        },
        quandoFechar(funcao) {
            aoFechar = funcao;
        }
    };
}

/* ------------------------------------------
   CAMPOS DO FORMULÁRIO
------------------------------------------ */

function montarCampo(campo) {

    if (campo.linha) {
        return `
            <div class="modal-linha">
                ${campo.linha.map(montarCampo).join("")}
            </div>
        `;
    }

    const id = `campo_${campo.nome}`;
    const obrigatorio = campo.obrigatorio ? "required" : "";
    const valor = campo.valor ?? "";

    const atributos = [
        obrigatorio,
        campo.min !== undefined ? `min="${campo.min}"` : "",
        campo.max !== undefined ? `max="${campo.max}"` : "",
        campo.step !== undefined ? `step="${campo.step}"` : "",
        campo.maxlength ? `maxlength="${campo.maxlength}"` : "",
        campo.minlength ? `minlength="${campo.minlength}"` : "",
        campo.placeholder ? `placeholder="${escaparHTML(campo.placeholder)}"` : "",
        campo.autocomplete ? `autocomplete="${campo.autocomplete}"` : ""
    ].join(" ");

    let entrada;

    if (campo.tipo === "select") {

        const opcoes = campo.opcoes.map((opcao) => `
            <option value="${escaparHTML(opcao.valor)}"
                ${String(opcao.valor) === String(valor) ? "selected" : ""}>
                ${escaparHTML(opcao.texto)}
            </option>
        `).join("");

        entrada = `
            <select id="${id}" name="${campo.nome}" ${obrigatorio}>
                <option value="" disabled ${valor === "" ? "selected" : ""}>
                    Selecione...
                </option>
                ${opcoes}
            </select>
        `;

    } else if (campo.tipo === "textarea") {

        entrada = `
            <textarea id="${id}" name="${campo.nome}" ${atributos}>${escaparHTML(valor)}</textarea>
        `;

    } else {

        entrada = `
            <input
                id="${id}"
                name="${campo.nome}"
                type="${campo.tipo || "text"}"
                value="${escaparHTML(valor)}"
                ${atributos}
            >
        `;
    }

    return `
        <div class="modal-campo">
            <label for="${id}">
                ${escaparHTML(campo.rotulo)}
                ${campo.obrigatorio ? '<span class="obrigatorio">*</span>' : ""}
            </label>
            ${entrada}
            ${campo.ajuda ? `<small class="ajuda">${escaparHTML(campo.ajuda)}</small>` : ""}
        </div>
    `;
}

/* ------------------------------------------
   MODAL COM FORMULÁRIO
   aoSalvar(valores) faz o fetch.
   Se der erro, a mensagem aparece dentro
   do modal e ele continua aberto.
------------------------------------------ */

function abrirFormulario({
    titulo,
    mensagem = "",
    campos,
    textoConfirmar = "Salvar",
    perigo = false,
    aoSalvar
}) {

    return new Promise((resolver) => {

        const modal = criarModal({
            titulo,
            perigo,
            conteudo: `
                <form novalidate>
                    ${mensagem ? `<p class="modal-mensagem">${mensagem}</p>` : ""}
                    <div class="modal-erro" role="alert"></div>
                    ${campos.map(montarCampo).join("")}
                    <div class="modal-botoes">
                        <button type="button" class="modal-cancelar">Cancelar</button>
                        <button type="submit" class="modal-confirmar">${escaparHTML(textoConfirmar)}</button>
                    </div>
                </form>
            `
        });

        let salvo = false;
        modal.quandoFechar(() => resolver(salvo));

        const formulario = modal.fundo.querySelector("form");
        const caixaErro = modal.fundo.querySelector(".modal-erro");
        const botaoConfirmar = modal.fundo.querySelector(".modal-confirmar");
        const botaoCancelar = modal.fundo.querySelector(".modal-cancelar");

        botaoCancelar.addEventListener("click", modal.fechar);

        const primeiroCampo = formulario.querySelector("input, select, textarea");
        setTimeout(() => (primeiroCampo || botaoConfirmar).focus(), 50);

        formulario.addEventListener("submit", async (evento) => {

            evento.preventDefault();

            caixaErro.classList.remove("visivel");

            // Validação do próprio navegador (required, min, max...)
            if (!formulario.checkValidity()) {

                const invalido = formulario.querySelector(":invalid");
                const rotulo = formulario
                    .querySelector(`label[for="${invalido.id}"]`)
                    .textContent.replace("*", "").trim();

                caixaErro.textContent = `${rotulo}: ${invalido.validationMessage}`;
                caixaErro.classList.add("visivel");
                invalido.focus();
                return;
            }

            const valores = Object.fromEntries(new FormData(formulario));

            // Remove espaços sobrando dos textos (menos das senhas)
            Object.keys(valores).forEach((chave) => {

                const elemento = formulario.elements[chave];
                const ehSenha = elemento && elemento.type === "password";

                if (typeof valores[chave] === "string" && !ehSenha) {
                    valores[chave] = valores[chave].trim();
                }
            });

            // Trava os botões: evita clicar duas vezes e duplicar o cadastro
            const textoOriginal = botaoConfirmar.textContent;
            botaoConfirmar.disabled = true;
            botaoCancelar.disabled = true;
            botaoConfirmar.textContent = "Salvando...";
            modal.setOcupado(true);

            try {

                await aoSalvar(valores);

                salvo = true;
                modal.setOcupado(false);
                modal.fechar();

            } catch (erro) {

                caixaErro.textContent = erro.message;
                caixaErro.classList.add("visivel");

                modal.setOcupado(false);
                botaoConfirmar.disabled = false;
                botaoCancelar.disabled = false;
                botaoConfirmar.textContent = textoOriginal;
            }
        });
    });
}

/* ------------------------------------------
   MODAL DE CONFIRMAÇÃO (ex: excluir)
------------------------------------------ */

function confirmarAcao({
    titulo,
    mensagem,
    textoConfirmar = "Confirmar",
    perigo = true,
    aoConfirmar
}) {

    return abrirFormulario({
        titulo,
        mensagem,
        campos: [],
        textoConfirmar,
        perigo,
        aoSalvar: aoConfirmar
    });
}
