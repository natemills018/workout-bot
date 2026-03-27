import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getProfile, setProfile, listProfiles } from "../../services/profileStore";
import { UserProfile } from "../../types/workout";

export default {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Manage your workout profile")
        .addSubcommand((sub) =>
            sub
                .setName("set")
                .setDescription("Set your workout profile")
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Your display name").setRequired(true)
                )
                .addStringOption((opt) =>
                    opt
                        .setName("experience")
                        .setDescription("Your lifting experience")
                        .setRequired(true)
                        .addChoices(
                            { name: "Beginner", value: "beginner" },
                            { name: "Intermediate", value: "intermediate" },
                            { name: "Advanced", value: "advanced" }
                        )
                )
                .addStringOption((opt) =>
                    opt
                        .setName("preference")
                        .setDescription("Workout preference (e.g. HIIT-focused, Zone 2 cardio, balanced)")
                        .setRequired(true)
                )
                .addStringOption((opt) =>
                    opt.setName("notes").setDescription("Extra notes (injuries, goals, etc.)").setRequired(false)
                )
                .addStringOption((opt) =>
                    opt.setName("height").setDescription("Your height (e.g. 5'11)").setRequired(false)
                )
                .addNumberOption((opt) =>
                    opt.setName("weight").setDescription("Current weight in lbs").setRequired(false)
                )
                .addNumberOption((opt) =>
                    opt.setName("goal_weight").setDescription("Goal weight in lbs").setRequired(false)
                )
                .addNumberOption((opt) =>
                    opt.setName("squat_pr").setDescription("Squat PR in lbs").setRequired(false)
                )
                .addNumberOption((opt) =>
                    opt.setName("bench_pr").setDescription("Bench press PR in lbs").setRequired(false)
                )
                .addNumberOption((opt) =>
                    opt.setName("deadlift_pr").setDescription("Deadlift PR in lbs").setRequired(false)
                )
        )
        .addSubcommand((sub) => sub.setName("view").setDescription("View your current profile"))
        .addSubcommand((sub) => sub.setName("list").setDescription("List all profiles")),

    async execute(interaction: ChatInputCommandInteraction) {
        const sub = interaction.options.getSubcommand();

        if (sub === "set") {
            const squatPr = interaction.options.getNumber("squat_pr");
            const benchPr = interaction.options.getNumber("bench_pr");
            const deadliftPr = interaction.options.getNumber("deadlift_pr");

            const prs = (squatPr || benchPr || deadliftPr)
                ? {
                    ...(squatPr ? { squat: squatPr } : {}),
                    ...(benchPr ? { bench: benchPr } : {}),
                    ...(deadliftPr ? { deadlift: deadliftPr } : {}),
                }
                : undefined;

            const existing = getProfile(interaction.user.id);

            const profile: UserProfile = {
                discordId: interaction.user.id,
                displayName: interaction.options.getString("name", true),
                experience: interaction.options.getString("experience", true) as UserProfile["experience"],
                preference: interaction.options.getString("preference", true),
                notes: interaction.options.getString("notes") ?? existing?.notes ?? "",
                height: interaction.options.getString("height") ?? existing?.height,
                weight: interaction.options.getNumber("weight") ?? existing?.weight,
                goalWeight: interaction.options.getNumber("goal_weight") ?? existing?.goalWeight,
                prs: prs ?? existing?.prs,
            };

            setProfile(profile);
            await interaction.reply(`Profile saved for **${profile.displayName}**!`);
        }

        if (sub === "view") {
            const profile = getProfile(interaction.user.id);
            if (!profile) {
                await interaction.reply("No profile found. Use `/profile set` to create one.");
                return;
            }

            const prLines = profile.prs
                ? [
                    profile.prs.squat ? `Squat: ${profile.prs.squat} lbs` : "",
                    profile.prs.bench ? `Bench: ${profile.prs.bench} lbs` : "",
                    profile.prs.deadlift ? `Deadlift: ${profile.prs.deadlift} lbs` : "",
                ].filter(Boolean).join(" | ")
                : "";

            const lines = [
                `**${profile.displayName}**`,
                `Experience: ${profile.experience}`,
                `Preference: ${profile.preference}`,
                profile.height ? `Height: ${profile.height}` : "",
                profile.weight ? `Weight: ${profile.weight} lbs` : "",
                profile.goalWeight ? `Goal: ${profile.goalWeight} lbs` : "",
                prLines ? `PRs: ${prLines}` : "",
                profile.notes ? `Notes: ${profile.notes}` : "",
            ].filter(Boolean);

            await interaction.reply(lines.join("\n"));
        }

        if (sub === "list") {
            const profiles = listProfiles();
            if (profiles.length === 0) {
                await interaction.reply("No profiles yet. Use `/profile set` to create one.");
                return;
            }

            const lines = profiles.map(
                (p) => `**${p.displayName}** — ${p.experience}, ${p.preference}`
            );
            await interaction.reply(lines.join("\n"));
        }
    },
};
