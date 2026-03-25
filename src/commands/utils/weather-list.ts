import { SlashCommandBuilder } from "discord.js";
import { getCities } from "../../services/cityStore";

export default {
    data: new SlashCommandBuilder()
        .setName("weather-list")
        .setDescription("Show all cities on the weather watch list"),
    async execute(interaction: any) {
        const cities = getCities();

        if (cities.length === 0) {
            await interaction.reply("No cities are being tracked. Use `/weather-add` to add one.");
            return;
        }

        const list = cities.map((c, i) => `${i + 1}. ${c.city}, ${c.state}`).join("\n");
        await interaction.reply(`**Weather Watch List**\n${list}`);
    },
};
