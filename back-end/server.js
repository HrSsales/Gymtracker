require("dotenv").config();

const app = require("./app");

if (!process.env.JWT_SECRET) {
    console.error("Defina JWT_SECRET no arquivo .env (veja o .env.example)");
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Documentação da API em http://localhost:${PORT}/api-docs`);
});
