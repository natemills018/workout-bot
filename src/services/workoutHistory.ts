import fs from "node:fs";
import path from "node:path";
import { WorkoutHistoryEntry, WorkoutPlan } from "../types/workout";

const HISTORY_PATH = path.join(__dirname, "..", "..", "data", "workout-history.json");
const MAX_PER_USER = 30;

function readAll(): WorkoutHistoryEntry[] {
    if (!fs.existsSync(HISTORY_PATH)) return [];
    const raw = fs.readFileSync(HISTORY_PATH, "utf-8");
    return JSON.parse(raw);
}

function writeAll(entries: WorkoutHistoryEntry[]): void {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(entries, null, 2));
}

export function saveWorkout(discordId: string, plan: WorkoutPlan): void {
    const entries = readAll();
    entries.push({
        discordId,
        date: new Date().toISOString(),
        plan,
    });

    const userEntries = entries.filter((e) => e.discordId === discordId);
    if (userEntries.length > MAX_PER_USER) {
        const cutoff = userEntries[userEntries.length - MAX_PER_USER].date;
        const trimmed = entries.filter(
            (e) => e.discordId !== discordId || e.date >= cutoff
        );
        writeAll(trimmed);
    } else {
        writeAll(entries);
    }
}

export function getRecentWorkouts(discordId: string, count: number = 5): WorkoutPlan[] {
    const entries = readAll();
    return entries
        .filter((e) => e.discordId === discordId)
        .slice(-count)
        .map((e) => e.plan);
}
