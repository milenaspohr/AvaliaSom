# AvaliaSom
O AvaliaSom é uma aplicação web desenvolvida em Node.js que permite pesquisar artistas, álbuns e músicas utilizando a API do Spotify, além de criar avaliações para esses conteúdos.

## Autores
Bruno Boenny
Milena Spohr

## Funcionalidades
- Cadastro e login de usuários
- Pesquisa de artistas, álbuns e músicas
- Visualização de detalhes
- Cadastro de avaliações
- Edição e exclusão de avaliações
- Listagem das avaliações do usuário
- Top 3 músicas mais avaliadas do mês

## Tecnologias utilizadas
- Node.js
- Express
- MySQL
- EJS
- Axios
- Spotify Web API

## Como executar o projeto

## 1. Clonar o repositório
git clone https://github.com/milenaspohr/AvaliaSom.git

## 2. Entrar na pasta do projeto
cd AvaliaSom

## 3. Instalar as dependências
npm install

## 4. Criar o banco de dados

Crie um banco chamado:
CREATE DATABASE avaliasom;

Depois, crie as tabelas necessárias (`usuarios` e `avaliacoes`).

## 5. Configurar o banco
No arquivo `bd.js`, configure os dados do seu MySQL:

```javascript
host: "localhost",
user: "root",
password: "",
database: "avaliasom"
```

## 6. Configurar a API do Spotify
No arquivo `spotify.js`, informe o seu **Client ID** e **Client Secret** obtidos no Spotify for Developers.

## 7. Executar o projeto
node app.js

O sistema estará disponível em:
http://localhost:3000


- Milena Spohr
- (Nome do colega)
