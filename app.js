const express = require("express");
const axios = require("axios");
const getToken = require("./spotify");
const app = express();
const bd = require("./bd");
const session = require("express-session");


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({

    secret: "musicboxd",

    resave: false,

    saveUninitialized: false

}));

function traduzirTipo(tipo) {

    switch (tipo) {

        case "artist":
            return "Artista";

        case "album":
            return "Álbum";

        case "track":
            return "Música";

        default:
            return tipo;

    }

}

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

//home
app.get("/home", (req, res) => {

    if (!req.session.usuario) {
        return res.redirect("/");
    }

    const sql = `
        SELECT
            spotifyId,
            titulo,
            COUNT(*) AS totalAvaliacoes,
            ROUND(AVG(nota),1) AS media
        FROM avaliacoes
        WHERE tipo = 'track'
        AND MONTH(dataCriacao) = MONTH(CURRENT_DATE())
        AND YEAR(dataCriacao) = YEAR(CURRENT_DATE())
        GROUP BY spotifyId, titulo
        ORDER BY totalAvaliacoes DESC
        LIMIT 3
    `;

    bd.query(sql, async (erro, resultados) => {

        if (erro) {
            console.log(erro);
            return res.send("Erro.");
        }

        try {

            const token = await getToken();
            const topMusicas = [];

            // top 3
            for (const musica of resultados) {

                const resposta = await axios.get(
                    `https://api.spotify.com/v1/tracks/${musica.spotifyId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                topMusicas.push({
                    ...musica,
                    imagem: resposta.data.album.images[0].url,
                    artista: resposta.data.artists[0].name
                });

            }

            // feed
        const generos = [
                        "pop",
                        "rock",
                        "rap",
                        "mpb",
                        "sertanejo"
                    ];
            const feed = [];

    for (const genero of generos) {

        const resposta = await axios.get(
            "https://api.spotify.com/v1/search",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    q: `genre:${genero}`,
                    type: "track",
                    limit: 4
                }
            }
        );

        feed.push({
            genero,
            musicas: resposta.data.tracks.items
        });

    }
                
            res.render("home", {
                usuario: req.session.usuario,
                topMusicas,
                feed

            });

        } catch (erro) {

            console.log(erro);
            res.send("Erro ao carregar a home.");

        }

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
                    limit: 6
                }
            }
        );

        const artistas = resultado.data.artists.items.slice(0, 3);
        const albuns = resultado.data.albums.items.slice(0, 3);
        const musicas = resultado.data.tracks.items.slice(0, 6);

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
            tipo,
            tipoTraduzido: traduzirTipo(tipo)


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
            tipo,
            tipoTraduzido: traduzirTipo(tipo)

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

// avaliações
app.get("/avaliacoes", (req, res) => {

    const idUsuario = req.session.usuario.idUsuario;

    const sql = `
        SELECT *
        FROM avaliacoes
        WHERE idUsuario = ?
        ORDER BY dataCriacao DESC
    `;

    bd.query(sql, [idUsuario], (erro, resultados) => {

        if (erro) {
            console.log(erro);
            return res.send("Erro.");
        }

        res.render("avaliacoes", {

            usuario: req.session.usuario,
            avaliacoes: resultados,
            traduzirTipo: traduzirTipo

        });

    });

});

// editar avaliação
app.get("/editar/:id", (req, res) => {

    const sql = `
        SELECT *
        FROM avaliacoes
        WHERE idAvaliacao = ?
        AND idUsuario = ?
    `;

    bd.query(

        sql,

        [

            req.params.id,
            req.session.usuario.idUsuario

        ],

        (erro, resultado) => {

            if(resultado.length == 0){

                return res.send("Avaliação não encontrada.");

            }

            res.render("editar", {

                avaliacao: resultado[0]

            });

        }

    );

});

app.post("/editar/:id", (req, res) => {

    const {

        nota,
        comentario

    } = req.body;

    const sql = `
        UPDATE avaliacoes

        SET

        nota = ?,
        comentario = ?

        WHERE idAvaliacao = ?
        AND idUsuario = ?
    `;

    bd.query(

        sql,

        [

            nota,
            comentario,
            req.params.id,
            req.session.usuario.idUsuario

        ],

        (erro) => {

            if(erro){

                console.log(erro);

                return res.send("Erro.");

            }

            res.redirect("/avaliacoes");

        }

    );

});

// deletar avaliação
app.get("/excluir/:id", (req, res) => {

    const sql = `
        DELETE FROM avaliacoes
        WHERE idAvaliacao = ?
        AND idUsuario = ?
    `;

    bd.query(

        sql,

        [

            req.params.id,
            req.session.usuario.idUsuario

        ],

        (erro) => {

            if(erro){

                console.log(erro);

                return res.send("Erro.");

            }

            res.redirect("/avaliacoes");

        }

    );

});


app.listen(3000, () => {
    console.log("Servidor rodando");
});