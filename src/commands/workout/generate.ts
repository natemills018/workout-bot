import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { generateWorkout } from "../../services/workoutGenerator";
import { getProfile } from "../../services/profileStore";
import { getRecentWorkouts, saveWorkout } from "../../services/workoutHistory";
import { WorkoutPlan } from "../../types/workout";

function formatWorkoutText(plan: WorkoutPlan): string {
    const lines: string[] = [
        `**${plan.title}**`,
        `_${plan.focus}_`,
        `Total: ${plan.totalDuration}`,
        "",
    ];

    for (const section of plan.sections) {
        lines.push(`__${section.name}__ (${section.duration})`);
        for (const exercise of section.exercises) {
            lines.push(`• ${exercise}`);
        }
        lines.push("");
    }

    return lines.join("\n");
}

export default {
    data: new SlashCommandBuilder()
        .setName("generate")
        .setDescription("Generate a workout plan"),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const profile = getProfile(interaction.user.id);
        const recent = getRecentWorkouts(interaction.user.id);
        const plan = await generateWorkout(profile, recent);
        saveWorkout(interaction.user.id, plan);
        const text = formatWorkoutText(plan);
        await interaction.editReply(text);
    },
};
