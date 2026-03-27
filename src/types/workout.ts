export interface WorkoutSection {
    name: string;
    duration: string;
    exercises: string[];
}

export interface WorkoutPlan {
    title: string;
    focus: string;
    totalDuration: string;
    sections: WorkoutSection[];
}

export interface WorkoutHistoryEntry {
    discordId: string;
    date: string;
    plan: WorkoutPlan;
}

export interface PersonalRecords {
    squat?: number;
    bench?: number;
    deadlift?: number;
}

export interface UserProfile {
    discordId: string;
    displayName: string;
    experience: "beginner" | "intermediate" | "advanced";
    preference: string;
    notes: string;
    height?: string;
    weight?: number;
    goalWeight?: number;
    prs?: PersonalRecords;
}
