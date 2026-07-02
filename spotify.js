const axios = require("axios");
require("dotenv").config();

async function getToken() {

    const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        "grant_type=client_credentials",
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization:
                    "Basic " +
                    Buffer.from(
                        `${process.env.client_id}:${process.env.client_secret}`
                    ).toString("base64")
            }
        }
    );

    return response.data.access_token;
}

module.exports = getToken;