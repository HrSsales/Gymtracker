const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

require("dotenv").config();

const documentacao = require("./docs/openapi.json");

const usuariosRoutes = require("./routes/usuarios");
const loginRoutes = require("./routes/login");
const perfilRoutes = require("./routes/perfil");
const statsRoutes = require("./routes/stats");
const treinosRoutes = require("./routes/treinos");
const exerciciosRoutes = require("./routes/exercicios");
const evolucaoRoutes = require("./routes/evolucao");

const { autenticar } = require("./middleware/auth");
const { rotaNaoEncontrada, tratarErros } = require("./middleware/erros");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

/* ==================================
   DOCUMENTAÇÃO (SWAGGER)
================================== */

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(documentacao));

/* ==================================
   ROTAS PÚBLICAS
================================== */

app.use("/usuarios", usuariosRoutes);
app.use("/login", loginRoutes);

/* ==================================
   ROTAS PROTEGIDAS (PRECISAM DE TOKEN)
================================== */

app.use("/perfil", autenticar, perfilRoutes);
app.use("/stats", autenticar, statsRoutes);
app.use("/treinos", autenticar, treinosRoutes);
app.use("/exercicios", autenticar, exerciciosRoutes);
app.use("/evolucao", autenticar, evolucaoRoutes);

/* ==================================
   FRONT-END
   Permite abrir o site em http://localhost:3000
================================== */

app.use(express.static(path.join(__dirname, "..", "front-end")));

/* ==================================
   ERROS
================================== */

app.use(rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
