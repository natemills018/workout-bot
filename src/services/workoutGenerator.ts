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
- Dumbbells: pair of 25 lbs, one 35 lb, one 50 lb
- Use DBs for accessory work and single-arm movements. The 50 lb DB enables heavier rows, goblet squats, and floor press.
- Concept 2 BikeErg
- Walking treadmill
- 20 lb weighted vest
- Outdoor running/walking

HARD CONSTRAINTS:
- LOW CEILINGS: NO standing overhead movements. Seated on bench or floor only.
- 60-minute max per session including warm-up.
- DBs: use 25 lb pair for light accessories, 35 lb for moderate single-arm work, 50 lb for heavy rows/goblet squats/floor press.
- REST PERIODS: 90 seconds between sets, 2-3 minutes between different movements. Always specify rest periods clearly (e.g. "Rest 90s between sets, 2 min before next movement").

WEEKLY SPLIT:
- Monday: Heavy Lower (squat focus)
- Tuesday: Upper Push/Pull
- Wednesday: Zone 2 Cardio
- Thursday: Heavy Upper (bench focus)
- Friday: Lower Hypertrophy + HIIT
- Saturday: Zone 2 Cardio
- Sunday: Rest day

TRAINING STYLE:
- CrossFit-inspired. Embrace bodyweight movements in conditioning: burpees, lunges, step-ups, box jumps (to bench), mountain climbers, etc.
- Core/abs should be a STAPLE — include ab work in every session (during warm-up, as accessory finisher, or woven into conditioning).
- HIIT conditioning should feel like a CrossFit metcon: mix bodyweight movements, BikeErg calories, weighted vest work, and DB movements into AMRAPs, EMOMs, or rounds-for-time.

WORKOUT STRUCTURE:
For strength days (Mon/Tue/Thu/Fri):
1. Warm-up / stretch (5-10 min)
2. Strength piece (15-25 min, compound barbell lifts)
3. Conditioning / metcon (15-25 min, CrossFit-style HIIT with bodyweight + equipment mix, always include core)

For Zone 2 days (Wed/Sat):
1. Warm-up / stretch (5-10 min)
2. Sustained Zone 2 cardio (35-45 min, heart rate 120-140 bpm, using BikeErg, treadmill walk, weighted vest walk, or outdoor movement)

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

const WEEKLY_SPLIT: Record<string, string | null> = {
    Monday: "Heavy Lower — squat-focused strength with moderate accessory work",
    Tuesday: "Upper Push/Pull — bench and row variations with upper body accessories",
    Wednesday: "Zone 2 Cardio — sustained low-intensity steady-state cardio (heart rate 120-140 bpm)",
    Thursday: "Heavy Upper — bench-focused strength with pressing and pulling compounds",
    Friday: "Lower Hypertrophy + HIIT — higher-rep leg work paired with high-intensity intervals",
    Saturday: "Zone 2 Cardio — sustained low-intensity steady-state cardio (heart rate 120-140 bpm)",
    Sunday: null,
};

function getDayOfWeek(): string {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

export function getTodaysFocus(): string | null {
    return WEEKLY_SPLIT[getDayOfWeek()] ?? null;
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

    const focus = WEEKLY_SPLIT[day];
    const parts: string[] = [`Today is ${day}.`];

    if (focus) {
        parts.push(`Today's programming: ${focus}. Follow this focus for the session.`);
    }

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
