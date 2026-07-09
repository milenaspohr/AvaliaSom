const mysql = require("mysql2");

const conexao = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "musicBoxd"
});

conexao.connect((erro) => {

    if (erro) {
        console.log("Erro ao conectar");
        return;
    }

    console.log("MySQL conectado!");

});

module.exports = conexao;