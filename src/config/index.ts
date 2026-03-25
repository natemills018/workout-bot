import dotenv from "dotenv";
dotenv.config();

const discord = {
    app_id: process.env.DISCORD_APP_ID,
    pub_key: process.env.DISCORD_PUB_KEY,
    client_id: process.env.DISCORD_CLIENT_ID as string,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    token: process.env.DISCORD_TOKEN as string,
    guild_id: process.env.DISCORD_GUILD_ID as string,
};

export default {
    discord,
};
