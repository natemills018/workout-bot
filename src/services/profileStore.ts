import fs from "node:fs";
import path from "node:path";
import { UserProfile } from "../types/workout";

const PROFILES_PATH = path.join(__dirname, "..", "..", "data", "profiles.json");

function readAll(): Record<string, UserProfile> {
    const raw = fs.readFileSync(PROFILES_PATH, "utf-8");
    return JSON.parse(raw);
}

function writeAll(profiles: Record<string, UserProfile>): void {
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2));
}

export function getProfile(discordId: string): UserProfile | null {
    const profiles = readAll();
    return profiles[discordId] ?? null;
}

export function setProfile(profile: UserProfile): void {
    const profiles = readAll();
    profiles[profile.discordId] = profile;
    writeAll(profiles);
}

export function listProfiles(): UserProfile[] {
    return Object.values(readAll());
}
