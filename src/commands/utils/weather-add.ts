import { SlashCommandBuilder } from "discord.js";
import { addCity } from "../../services/cityStore";

export default {
    data: new SlashCommandBuilder()
        .setName("weather-add")
        .setDescription("Add a city to the weather watch list")
        .addStringOption((option) =>
            option.setName("city").setDescription("City name").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName("state").setDescription("State abbreviation (e.g. AL, IL, NY)").setRequired(true)
        ),
    async execute(interaction: any) {
        const city = interaction.options.getString("city");
        const state = interaction.options.getString("state");
        const result = addCity(city, state);
        await interaction.reply(result.message);
    },
};
