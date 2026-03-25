import { SlashCommandBuilder } from "discord.js";
import { fetchWeather } from "../../services/weatherService";
import { buildWeatherEmbed } from "../../utils/weatherEmbed";
import config from "../../config";

export default {
    data: new SlashCommandBuilder()
        .setName("weather")
        .setDescription("Gets the current weather for a city")
        .addStringOption((option) =>
            option.setName("city").setDescription("City name (defaults to Birmingham)").setRequired(false)
        ),
    async execute(interaction: any) {
        await interaction.deferReply();

        try {
            const city = interaction.options.getString("city") || config.weather.defaultCity;
            const state = city === config.weather.defaultCity ? config.weather.defaultState : "";
            const weather = await fetchWeather(city, state);
            const embed = buildWeatherEmbed(weather);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Weather command failed:", error);
            await interaction.editReply({ content: "Failed to fetch weather data. Please try again later." });
        }
    },
};
