import { EmbedBuilder } from "discord.js";
import { WorkoutPlan } from "../types/workout";

const SECTION_COLORS: Record<string, number> = {
    "warm-up": 0x3498db,
    "warmup": 0x3498db,
    "strength": 0xe74c3c,
    "conditioning": 0x2ecc71,
};

function getSectionEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes("warm")) return "\u{1F525}";
    if (lower.includes("strength")) return "\u{1F4AA}";
    if (lower.includes("conditioning") || lower.includes("cardio") || lower.includes("hiit")) return "\u{26A1}";
    return "\u{1F3CB}";
}

function getEmbedColor(plan: WorkoutPlan): number {
    const title = plan.title.toLowerCase();
    if (title.includes("zone 2") || title.includes("cardio") || title.includes("recovery")) return 0x2ecc71;
    if (title.includes("hiit") || title.includes("interval")) return 0xe67e22;
    return 0xe74c3c;
}

export function buildWorkoutEmbed(plan: WorkoutPlan, displayName?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTitle(plan.title)
        .setDescription(`*${plan.focus}*`)
        .setColor(getEmbedColor(plan))
        .setTimestamp();

    if (displayName) {
        embed.setAuthor({ name: `Workout for ${displayName}` });
    }

    for (const section of plan.sections) {
        const emoji = getSectionEmoji(section.name);
        const exercises = section.exercises.map((e) => `\u2022 ${e}`).join("\n");
        embed.addFields({
            name: `${emoji} ${section.name} (${section.duration})`,
            value: exercises || "No exercises listed",
            inline: false,
        });
    }

    embed.setFooter({ text: `Total: ${plan.totalDuration}` });

    return embed;
}
