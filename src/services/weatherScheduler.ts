import cron from "node-cron";
import { Client, TextChannel } from "discord.js";
import { fetchWeather } from "./weatherService";
import { buildWeatherEmbed } from "../utils/weatherEmbed";
import { getCities } from "./cityStore";
import config from "../config";

export function startWeatherScheduler(client: Client): void {
    const { channelId, cronSchedule } = config.weather;

    if (!channelId) {
        console.warn("[Scheduler] WEATHER_CHANNEL_ID not set -- scheduler disabled.");
        return;
    }

    if (!cron.validate(cronSchedule)) {
        console.error(`[Scheduler] Invalid cron expression: "${cronSchedule}" -- scheduler disabled.`);
        return;
    }

    cron.schedule(cronSchedule, async () => {
        const cities = getCities();

        if (cities.length === 0) {
            console.warn("[Scheduler] No cities to report on. Use /weather-add to add one.");
            return;
        }

        try {
            const channel = await client.channels.fetch(channelId);

            if (!channel || !channel.isTextBased()) {
                console.error("[Scheduler] Channel not found or is not a text channel.");
                return;
            }

            for (const entry of cities) {
                try {
                    const weather = await fetchWeather(entry.city, entry.state);
                    const embed = buildWeatherEmbed(weather);
                    await (channel as TextChannel).send({ embeds: [embed] });
                    console.log(`[Scheduler] Posted weather for ${weather.city}, ${weather.state}`);
                } catch (error) {
                    console.error(`[Scheduler] Failed to fetch weather for ${entry.city}, ${entry.state}:`, error);
                }
            }
        } catch (error) {
            console.error("[Scheduler] Failed to access channel:", error);
        }
    });

    console.log(`[Scheduler] Started -- posting to channel ${channelId} on schedule "${cronSchedule}"`);
}
