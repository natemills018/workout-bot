import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getRecentWorkouts } from "../../services/workoutHistory";
import { getProfile } from "../../services/profileStore";

export default {
    data: new SlashCommandBuilder()
        .setName("history")
        .setDescription("View your recent workouts"),

    async execute(interaction: ChatInputCommandInteraction) {
        const recent = getRecentWorkouts(interaction.user.id);

        if (recent.length === 0) {
            await interaction.reply("No workout history yet. Use `/generate` to create your first workout.");
            return;
        }

        const profile = getProfile(interaction.user.id);
        const name = profile?.displayName ?? interaction.user.displayName;

        const embed = new EmbedBuilder()
            .setTitle(`Recent Workouts for ${name}`)
            .setColor(0x9b59b6)
            .setTimestamp();

        for (const plan of recent) {
            const exercises = plan.sections
                .flatMap((s) => s.exercises)
                .slice(0, 3)
                .join(", ");

            embed.addFields({
                name: plan.title,
                value: `${plan.focus}\n*${exercises}...*`,
                inline: false,
            });
        }

        embed.setFooter({ text: `Showing last ${recent.length} workout(s)` });
        await interaction.reply({ embeds: [embed] });
    },
};
