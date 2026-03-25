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

const weather = {
    apiKey: process.env.OPENWEATHER_API_KEY as string,
    defaultCity: process.env.WEATHER_DEFAULT_CITY || "Birmingham",
    defaultState: process.env.WEATHER_DEFAULT_STATE || "AL",
    channelId: process.env.WEATHER_CHANNEL_ID as string,
    cronSchedule: process.env.WEATHER_CRON_SCHEDULE || "0 7 * * *",
};

export default {
    discord,
    weather,
};
