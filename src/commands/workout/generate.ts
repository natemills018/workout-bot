import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { generateWorkout } from "../../services/workoutGenerator";
import { getProfile } from "../../services/profileStore";
import { getRecentWorkouts, saveWorkout } from "../../services/workoutHistory";
import { buildWorkoutEmbed } from "../../utils/workoutEmbed";

export default {
    data: new SlashCommandBuilder()
        .setName("generate")
        .setDescription("Generate a workout plan"),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const profile = getProfile(interaction.user.id);
        const recent = getRecentWorkouts(interaction.user.id);

        try {
            const plan = await generateWorkout(profile, recent);
            saveWorkout(interaction.user.id, plan);
            const embed = buildWorkoutEmbed(plan, profile?.displayName);
            await interaction.editReply({ embeds: [embed] });
        } catch (error: unknown) {
            console.error("Workout generation failed:", error);

            const message = error instanceof Error ? error.message : "Unknown error";

            if (message.includes("429") || message.includes("quota")) {
                await interaction.editReply("Gemini API rate limit hit. Try again in a minute.");
            } else {
                await interaction.editReply("Something went wrong generating your workout. Check the logs.");
            }
        }
    },
};
