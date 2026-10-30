/* ==================================
   TESTES DAS ROTAS DA API
   O banco é substituído por um "mock":
   cada teste diz o que pool.query devolve.
   Assim os testes rodam sem PostgreSQL.
================================== */

process.env.JWT_SECRET = "segredo_de_teste";

jest.mock("../config/db", () => ({
    query: jest.fn()
}));

const request = require("supertest");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const app = require("../app");
const { gerarToken } = require("../middleware/auth");

const usuario = { id: 1, nome: "Ana", email: "ana@email.com" };
const token = gerarToken(usuario);
const auth = { Authorization: `Bearer ${token}` };

beforeEach(() => {
    pool.query.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

/* ---------- AUTENTICAÇÃO ---------- */

describe("POST /usuarios (cadastro)", () => {

    test("201 e senha salva como hash", async () => {

        pool.query
            .mockResolvedValueOnce({ rows: [] })                  // email livre
            .mockResolvedValueOnce({ rows: [{ id: 1, nome: "Ana", email: "ana@email.com" }] });

        const res = await request(app)
            .post("/usuarios")
            .send({ nome: "Ana", email: "ANA@email.com", senha: "senha123" });

        expect(res.status).toBe(201);

        const [, parametros] = pool.query.mock.calls[1];
        expect(parametros[1]).toBe("ana@email.com");          // email normalizado
        expect(parametros[2]).not.toBe("senha123");            // nunca texto puro
        expect(await bcrypt.compare("senha123", parametros[2])).toBe(true);
    });

    test("409 se o email já existe", async () => {

        pool.query.mockResolvedValueOnce({ rows: [{ id: 9 }] });

        const res = await request(app)
            .post("/usuarios")
            .send({ nome: "Ana", email: "ana@email.com", senha: "senha123" });

        expect(res.status).toBe(409);
    });

    test("400 com senha curta (nem chega no banco)", async () => {

        const res = await request(app)
            .post("/usuarios")
            .send({ nome: "Ana", email: "ana@email.com", senha: "123" });

        expect(res.status).toBe(400);
        expect(pool.query).not.toHaveBeenCalled();
    });

});

describe("POST /login", () => {

    test("200 e devolve token com senha correta", async () => {

        const hash = await bcrypt.hash("senha123", 4);
        pool.query.mockResolvedValueOnce({ rows: [{ ...usuario, senha: hash }] });

        const res = await request(app)
            .post("/login")
            .send({ email: "ana@email.com", senha: "senha123" });

        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.usuario.senha).toBeUndefined();
    });

    test("401 com senha errada", async () => {

        const hash = await bcrypt.hash("senha123", 4);
        pool.query.mockResolvedValueOnce({ rows: [{ ...usuario, senha: hash }] });

        const res = await request(app)
            .post("/login")
            .send({ email: "ana@email.com", senha: "errada" });

        expect(res.status).toBe(401);
    });

    test("401 com email inexistente", async () => {

        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post("/login")
            .send({ email: "ninguem@email.com", senha: "senha123" });

        expect(res.status).toBe(401);
    });

});

describe("proteção das rotas", () => {

    test("401 sem token", async () => {
        const res = await request(app).get("/treinos");
        expect(res.status).toBe(401);
    });

    test("401 com token falso", async () => {
        const res = await request(app)
            .get("/treinos")
            .set("Authorization", "Bearer token.falso.aqui");
        expect(res.status).toBe(401);
    });

    test("400 com JSON mal formatado", async () => {
        const res = await request(app)
            .post("/login")
            .set("Content-Type", "application/json")
            .send("{ email: ");
        expect(res.status).toBe(400);
    });

    test("404 em rota inexistente", async () => {
        const res = await request(app).get("/nao-existe");
        expect(res.status).toBe(404);
    });

});

/* ---------- TREINOS ---------- */

describe("treinos", () => {

    test("GET lista só os treinos do usuário do token", async () => {

        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, nome: "Treino A" }] });

        const res = await request(app).get("/treinos").set(auth);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(pool.query.mock.calls[0][1]).toEqual([usuario.id]);
    });

    test("POST usa o id do token, ignorando usuario_id do corpo", async () => {

        pool.query.mockResolvedValueOnce({ rows: [{ id: 7, nome: "Treino B" }] });

        const res = await request(app)
            .post("/treinos")
            .set(auth)
            .send({ nome: "Treino B", usuario_id: 999 });

        expect(res.status).toBe(201);
        expect(pool.query.mock.calls[0][1]).toEqual(["Treino B", null, usuario.id]);
    });

    test("POST sem nome devolve 400", async () => {

        const res = await request(app).post("/treinos").set(auth).send({ nome: " " });

        expect(res.status).toBe(400);
    });

    test("PUT de treino de outra pessoa devolve 404", async () => {

        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put("/treinos/50")
            .set(auth)
            .send({ nome: "Hackeado" });

        expect(res.status).toBe(404);
    });

    test("DELETE com id inválido devolve 400", async () => {

        const res = await request(app).delete("/treinos/abc").set(auth);

        expect(res.status).toBe(400);
    });

    test("DELETE com sucesso", async () => {

        pool.query.mockResolvedValueOnce({ rows: [{ id: 3 }] });

        const res = await request(app).delete("/treinos/3").set(auth);

        expect(res.status).toBe(200);
    });

});

/* ---------- EXERCÍCIOS ---------- */

describe("exercícios", () => {

    const exercicio = {
        nome: "Supino",
        grupo_muscular: "Peito",
        series: 4,
        repeticoes: 10,
        treino_id: 2
    };

    test("POST em treino que não é do usuário devolve 404", async () => {

        pool.query.mockResolvedValueOnce({ rows: [] });         // treino não é dele

        const res = await request(app).post("/exercicios").set(auth).send(exercicio);

        expect(res.status).toBe(404);
        expect(pool.query).toHaveBeenCalledTimes(1);             // não inseriu
    });

    test("POST válido devolve 201", async () => {

        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 2 }] })
            .mockResolvedValueOnce({ rows: [{ id: 10, ...exercicio }] });

        const res = await request(app).post("/exercicios").set(auth).send(exercicio);

        expect(res.status).toBe(201);
        expect(res.body.id).toBe(10);
    });

    test("POST com séries inválidas devolve 400", async () => {

        const res = await request(app)
            .post("/exercicios")
            .set(auth)
            .send({ ...exercicio, series: 0 });

        expect(res.status).toBe(400);
    });

});

/* ---------- EVOLUÇÃO ---------- */

describe("evolução", () => {

    test("DELETE existe e funciona (antes estava dentro do POST)", async () => {

        pool.query.mockResolvedValueOnce({ rows: [{ id: 4 }] });

        const res = await request(app).delete("/evolucao/4").set(auth);

        expect(res.status).toBe(200);
    });

    test("PUT de registro inexistente devolve 404", async () => {

        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 1 }] })   // exercício é do usuário
            .mockResolvedValueOnce({ rows: [] });           // registro não achado

        const res = await request(app)
            .put("/evolucao/99")
            .set(auth)
            .send({ peso: 50, data_registro: "2026-01-10", exercicio_id: 1 });

        expect(res.status).toBe(404);
    });

    test("POST com data no futuro devolve 400", async () => {

        const res = await request(app)
            .post("/evolucao")
            .set(auth)
            .send({ peso: 50, data_registro: "2999-01-01", exercicio_id: 1 });

        expect(res.status).toBe(400);
    });

});

/* ---------- ERRO DO BANCO ---------- */

describe("falha no banco", () => {

    test("devolve 500 sem expor detalhes", async () => {

        pool.query.mockRejectedValueOnce(new Error("conexão recusada"));

        const res = await request(app).get("/stats").set(auth);

        expect(res.status).toBe(500);
        expect(JSON.stringify(res.body)).not.toMatch(/conexão recusada/);
    });

});
