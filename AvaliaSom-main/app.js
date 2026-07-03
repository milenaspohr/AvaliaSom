const express = require("express");
const axios = require("axios");
const getToken = require("./spotify");
const app = express();
const bd = require("./bd");
const session = require("express-session");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(session({

    secret: "musicboxd",

    resave: false,

    saveUninitialized: false

}));

// cadastro
app.get("/cadastro", (req, res) => {
    res.render("cadastro");
});

app.post("/cadastro", (req, res) => {

    const { nome, email, senha } = req.body;

    const sql =
        "INSERT INTO usuarios (nome,email,senha) VALUES (?,?,?)";

    bd.query(
        sql,
        [nome, email, senha],
        (erro) => {

            if (erro) {
                console.log(erro);
                return res.send("Erro ao cadastrar");
            }

            res.send("Usuário cadastrado!");
        }
    );

});

app.get("/", (req, res) => {

    res.render("login");
});
// login
app.post("/login", (req, res) => {

    const { email, senha } = req.body;

    const sql = "SELECT * FROM usuarios WHERE email = ? AND senha = ?";

    bd.query(sql, [email, senha], (erro, resultado) => {

        if (erro) {
            console.log(erro);
            return res.send("Erro ao fazer login.");
        }

        if (resultado.length > 0) {

            req.session.usuario = resultado[0];
            res.redirect("/home");

        } else {

            res.send("Email ou senha incorretos.");

        }

    });

});
// logout
app.get("/logout", (req, res) => {

    req.session.destroy((erro) => {

        if (erro) {
            return res.send("Erro ao sair.");
        }

        res.redirect("/");

    });

});
// home
app.get("/home", (req, res) => {

    if (!req.session.usuario) {

        return res.redirect("/");

    }

    res.render("home", {

    usuario: req.session.usuario

});


});
// pesquisa
app.get("/buscar", async (req, res) => {

    try {

        const pesquisa = req.query.q;

        const token = await getToken();

        const resultado = await axios.get(
            "https://api.spotify.com/v1/search",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    q: pesquisa,
                    type: "artist,album,track",
                    limit: 5
                }
            }
        );

        const artistas = resultado.data.artists.items.slice(0, 3);
        const albuns = resultado.data.albums.items.slice(0, 3);
        const musicas = resultado.data.tracks.items.slice(0, 5);

        res.render("resultado", {
            artistas,
            albuns,
            musicas
        });

    } catch (erro) {

        console.error(erro);
        res.send("Erro ao pesquisar.");

    }

});
// detalhes 
app.get("/detalhes/:tipo/:id", async (req, res) => {

    try {

        const tipo = req.params.tipo;
        const id = req.params.id;

        const token = await getToken();

        const resultado = await axios.get(

            `https://api.spotify.com/v1/${tipo}s/${id}`,

            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

        );

        res.render("detalhes", {

            item: resultado.data,
            tipo

        });

    } catch (erro) {

        console.log(erro);

        res.send("Erro ao abrir detalhes.");

    }

});
// avaliar
app.get("/avaliar/:tipo/:id", async (req, res) => {

    try {

        const tipo = req.params.tipo;
        const id = req.params.id;

        const token = await getToken();

        const resultado = await axios.get(

            `https://api.spotify.com/v1/${tipo}s/${id}`,

            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

        );

        res.render("avaliar", {

            item: resultado.data,
            tipo

        });

    } catch (erro) {

        console.log(erro);
        res.send("Erro.");

    }

});

app.post("/avaliar", (req, res) => {

    const {

        spotifyId,
        tipo,
        titulo,
        nota,
        comentario

    } = req.body;

    const idUsuario = req.session.usuario.idUsuario;

    const sql = `
        INSERT INTO avaliacoes
        (idUsuario, spotifyId, tipo, titulo, nota, comentario)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    bd.query(

        sql,

        [

            idUsuario,
            spotifyId,
            tipo,
            titulo,
            nota,
            comentario

        ],

        (erro) => {

            if (erro) {

                console.log(erro);
                return res.send("Erro ao salvar.");

            }

            res.send("Avaliação salva com sucesso!");

        }

    );

});

app.listen(3000, () => {
    console.log("Servidor rodando");
});