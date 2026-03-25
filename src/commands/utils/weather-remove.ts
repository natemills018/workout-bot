import { SlashCommandBuilder } from "discord.js";
import { removeCity } from "../../services/cityStore";

export default {
    data: new SlashCommandBuilder()
        .setName("weather-remove")
        .setDescription("Remove a city from the weather watch list")
        .addStringOption((option) =>
            option.setName("city").setDescription("City name to remove").setRequired(true)
        ),
    async execute(interaction: any) {
        const city = interaction.options.getString("city");
        const result = removeCity(city);
        await interaction.reply(result.message);
    },
};
