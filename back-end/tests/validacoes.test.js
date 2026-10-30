const {
    validarId,
    validarEmail,
    validarSenha,
    validarCadastroUsuario,
    validarLogin,
    validarTreino,
    validarExercicio,
    validarEvolucao
} = require("../utils/validacoes");

/* ==================================
   TESTES UNITÁRIOS DAS REGRAS DE NEGÓCIO
   (não usam banco nem servidor)
================================== */

function dataDeHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

describe("validarId", () => {

    test("aceita inteiro positivo (número ou texto)", () => {
        expect(validarId(5)).toBeNull();
        expect(validarId("12")).toBeNull();
    });

    test("recusa zero, negativo, decimal e texto", () => {
        expect(validarId(0)).toBe("ID inválido");
        expect(validarId("-3")).toBe("ID inválido");
        expect(validarId("1.5")).toBe("ID inválido");
        expect(validarId("abc")).toBe("ID inválido");
    });

});

describe("cadastro de usuário", () => {

    const valido = { nome: "Ana", email: "ana@email.com", senha: "senha123" };

    test("dados corretos passam", () => {
        expect(validarCadastroUsuario(valido)).toBeNull();
    });

    test("campo faltando é recusado", () => {
        expect(validarCadastroUsuario({ ...valido, nome: "" }))
            .toBe("Todos os campos são obrigatórios");
        expect(validarCadastroUsuario())
            .toBe("Todos os campos são obrigatórios");
    });

    test("email mal formatado é recusado", () => {
        expect(validarEmail("ana.email.com")).toBe("Email inválido");
        expect(validarCadastroUsuario({ ...valido, email: "ana@" }))
            .toBe("Email inválido");
    });

    test("senha precisa de 6 a 72 caracteres", () => {
        expect(validarSenha("12345")).toMatch(/pelo menos 6/);
        expect(validarSenha("a".repeat(73))).toMatch(/no máximo 72/);
        expect(validarSenha("123456")).toBeNull();
    });

    test("nome só com espaços é recusado", () => {
        expect(validarCadastroUsuario({ ...valido, nome: "   " }))
            .toBe("Nome é obrigatório");
    });

});

describe("login", () => {

    test("exige email e senha", () => {
        expect(validarLogin({ email: "a@a.com" })).toBe("Email e senha são obrigatórios");
        expect(validarLogin({ email: "a@a.com", senha: "x" })).toBeNull();
    });

});

describe("validarTreino", () => {

    test("nome obrigatório", () => {
        expect(validarTreino({ nome: "" })).toBe("Nome do treino é obrigatório");
    });

    test("descrição é opcional", () => {
        expect(validarTreino({ nome: "Treino A" })).toBeNull();
    });

    test("descrição muito longa é recusada", () => {
        expect(validarTreino({ nome: "Treino A", descricao: "x".repeat(501) }))
            .toMatch(/500 caracteres/);
    });

});

describe("validarExercicio", () => {

    const valido = {
        nome: "Supino reto",
        grupo_muscular: "Peito",
        series: 4,
        repeticoes: 10,
        treino_id: 1
    };

    test("exercício correto passa", () => {
        expect(validarExercicio(valido)).toBeNull();
    });

    test("grupo muscular fora da lista é recusado", () => {
        expect(validarExercicio({ ...valido, grupo_muscular: "Orelha" }))
            .toBe("Grupo muscular inválido");
    });

    test("séries precisa ser inteiro entre 1 e 20", () => {
        expect(validarExercicio({ ...valido, series: 2.5 })).toMatch(/Séries/);
        expect(validarExercicio({ ...valido, series: 21 })).toMatch(/Séries/);
        expect(validarExercicio({ ...valido, series: -1 })).toMatch(/Séries/);
    });

    test("repetições precisa ser inteiro entre 1 e 100", () => {
        expect(validarExercicio({ ...valido, repeticoes: 101 })).toMatch(/Repetições/);
    });

    test("campo faltando é recusado", () => {
        const { treino_id, ...semTreino } = valido;
        expect(validarExercicio(semTreino)).toBe("Todos os campos são obrigatórios");
    });

});

describe("validarEvolucao", () => {

    const valido = {
        peso: 42.5,
        data_registro: "2026-01-15",
        observacao: "Boa execução",
        exercicio_id: 3
    };

    test("registro correto passa", () => {
        expect(validarEvolucao(valido)).toBeNull();
    });

    test("data de hoje é aceita", () => {
        expect(validarEvolucao({ ...valido, data_registro: dataDeHoje() })).toBeNull();
    });

    test("peso zero é aceito (exercício só com peso do corpo)", () => {
        expect(validarEvolucao({ ...valido, peso: 0 })).toBeNull();
    });

    test("peso negativo ou não numérico é recusado", () => {
        expect(validarEvolucao({ ...valido, peso: -5 })).toMatch(/Peso/);
        expect(validarEvolucao({ ...valido, peso: "muito" })).toMatch(/Peso/);
    });

    test("data em formato errado é recusada", () => {
        expect(validarEvolucao({ ...valido, data_registro: "15/01/2026" }))
            .toBe("Data deve estar no formato AAAA-MM-DD");
    });

    test("data impossível é recusada", () => {
        expect(validarEvolucao({ ...valido, data_registro: "2026-02-31" }))
            .toBe("Data inválida");
    });

    test("data no futuro é recusada", () => {
        expect(validarEvolucao({ ...valido, data_registro: "2999-01-01" }))
            .toBe("A data não pode estar no futuro");
    });

    test("campos obrigatórios", () => {
        expect(validarEvolucao({ data_registro: "2026-01-01", exercicio_id: 1 }))
            .toBe("Peso, data e exercício são obrigatórios");
    });

});
