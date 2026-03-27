import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config";
import { UserProfile, WorkoutPlan } from "../types/workout";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const primaryModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

const SYSTEM_PROMPT = `You are a strength and conditioning coach generating daily workout plans.

EQUIPMENT AVAILABLE:
- Squat rig with flat bench
- Barbell + plates up to 300 lbs
- Dumbbells up to 25 lbs (accessory work only, not primary strength)
- Concept 2 BikeErg
- Walking treadmill
- 20 lb weighted vest
- Outdoor running/walking

HARD CONSTRAINTS:
- LOW CEILINGS: NO standing overhead movements. Seated on bench or floor only.
- 60-minute max per session including warm-up.
- DB weight limited to 25 lbs — use for accessory work only.

WORKOUT STRUCTURE (every session):
1. Warm-up / stretch (5-10 min)
2. Strength piece (15-25 min, moderate weight)
3. Conditioning piece (15-25 min, HIIT or Zone 2 cardio)

Respond with ONLY valid JSON matching this exact schema — no markdown, no code fences:
{
  "title": "string",
  "focus": "string (brief description of the day's focus)",
  "totalDuration": "string (e.g. '55 min')",
  "sections": [
    {
      "name": "string (e.g. 'Warm-Up', 'Strength', 'Conditioning')",
      "duration": "string (e.g. '8 min')",
      "exercises": ["string (exercise — sets x reps @ weight, or description)"]
    }
  ]
}`;

function getDayOfWeek(): string {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function summarizeHistory(recentWorkouts: WorkoutPlan[]): string {
    if (recentWorkouts.length === 0) return "";

    const summaries = recentWorkouts.map((w, i) => {
        const exercises = w.sections
            .flatMap((s) => s.exercises)
            .slice(0, 4)
            .join(", ");
        return `  ${i + 1}. ${w.title} — ${exercises}`;
    });

    return [
        "\nRECENT WORKOUTS (avoid repeating these focus areas and exercises):",
        ...summaries,
    ].join("\n");
}

function buildUserPrompt(profile?: UserProfile | null, recentWorkouts: WorkoutPlan[] = []): string {
    const day = getDayOfWeek();
    const history = summarizeHistory(recentWorkouts);

    const parts: string[] = [`Today is ${day}.`];

    if (profile) {
        parts.push(
            `Generate a workout for ${profile.displayName}.`,
            `Experience: ${profile.experience}.`,
            `Preference: ${profile.preference}.`,
        );
        if (profile.height || profile.weight) {
            const stats: string[] = [];
            if (profile.height) stats.push(`Height: ${profile.height}`);
            if (profile.weight) stats.push(`Current weight: ${profile.weight} lbs`);
            if (profile.goalWeight) stats.push(`Goal weight: ${profile.goalWeight} lbs`);
            parts.push(`Body stats: ${stats.join(", ")}.`);
        }
        if (profile.prs) {
            const prs: string[] = [];
            if (profile.prs.squat) prs.push(`Squat ${profile.prs.squat} lbs`);
            if (profile.prs.bench) prs.push(`Bench ${profile.prs.bench} lbs`);
            if (profile.prs.deadlift) prs.push(`Deadlift ${profile.prs.deadlift} lbs`);
            parts.push(`Personal records: ${prs.join(", ")}. Use these to calibrate working weights (typically 60-75% of 1RM for working sets).`);
        }
        if (profile.goalWeight && profile.weight && profile.goalWeight < profile.weight) {
            parts.push("This user is in a cut — favor higher-rep strength work and calorie-burning conditioning.");
        }
        if (profile.notes) parts.push(`Notes: ${profile.notes}.`);
    } else {
        parts.push("Generate a workout for a general fitness enthusiast.");
    }

    parts.push("Vary the muscle groups and conditioning style from recent sessions.");

    if (history) parts.push(history);

    return parts.join(" ");
}

async function callModel(model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>, prompt: string): Promise<string> {
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
    });
    return result.response.text().trim();
}

function parseWorkoutResponse(text: string): WorkoutPlan {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");

    try {
        return JSON.parse(cleaned) as WorkoutPlan;
    } catch {
        return {
            title: "Workout (raw response)",
            focus: "AI response could not be parsed as structured JSON",
            totalDuration: "~60 min",
            sections: [{ name: "Full Workout", duration: "60 min", exercises: [text] }],
        };
    }
}

export async function generateWorkout(profile?: UserProfile | null, recentWorkouts: WorkoutPlan[] = []): Promise<WorkoutPlan> {
    const prompt = buildUserPrompt(profile, recentWorkouts);

    try {
        const text = await callModel(primaryModel, prompt);
        return parseWorkoutResponse(text);
    } catch (error: unknown) {
        const status = (error as { status?: number }).status;
        if (status === 503 || status === 429) {
            console.log(`Primary model unavailable (${status}), falling back to flash-lite...`);
            const text = await callModel(fallbackModel, prompt);
            return parseWorkoutResponse(text);
        }
        throw error;
    }
}
