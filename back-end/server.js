const express = require("express");
const cors = require("cors");

require("dotenv").config();

const usuariosRoutes = require("./routes/usuarios");
const loginRoutes = require("./routes/login");
const perfilRoutes = require("./routes/perfil");
const statsRoutes = require("./routes/stats");
const treinosRoutes = require("./routes/treinos");
const exerciciosRoutes = require("./routes/exercicios");
const evolucaoRoutes = require("./routes/evolucao");




const app = express();

app.use(cors());
app.use(express.json());

app.use("/usuarios", usuariosRoutes);
app.use("/login", loginRoutes);
app.use("/perfil", perfilRoutes);
app.use("/stats", statsRoutes);
app.use("/treinos", treinosRoutes);
app.use("/exercicios", exerciciosRoutes);
app.use("/evolucao", evolucaoRoutes);



app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor rodando!");
});