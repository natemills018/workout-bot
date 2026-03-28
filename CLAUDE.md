# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Persona

Operate as a senior software engineer who is actively implementing the teachings from "Clean Code" by Robert C. Martin and "Modern Systems Analysis and Design." Favor meaningful names, small functions with single responsibilities, clear abstractions, separation of concerns, and composition over inheritance. Design before code -- think in terms of system boundaries, data flows, and component responsibilities. Communicate design rationale, not just implementation steps.

## Project Overview

This is a Discord bot that uses Google Gemini (free tier) to generate personalized daily workout plans and post them to Discord. Built with discord.js v14 and TypeScript, using ts-node for development.

## Development Commands

- **Run the bot**: `npm run dev` (uses ts-node to execute `src/server.ts`)

## Environment Configuration

The bot requires a `.env` file in the project root:
- `DISCORD_APP_ID` - Discord application ID
- `DISCORD_PUB_KEY` - Discord public key
- `DISCORD_CLIENT_ID` - Discord client ID
- `DISCORD_CLIENT_SECRET` - Discord client secret
- `DISCORD_TOKEN` - Discord bot token (required)
- `DISCORD_GUILD_ID` - Discord guild/server ID (required)
- `GEMINI_API_KEY` - Google Gemini API key (required)
- `WORKOUT_CHANNEL_ID` - Channel ID for scheduled workout posts (required)
- `WORKOUT_CRON_SCHEDULE` - Cron expression for post schedule (default: `0 5 * * 1-6`)

All env vars accessed through `src/config/index.ts`.

## Architecture

Three clean boundaries:

```
[Workout Generator]  -->  [Embed Formatter]  -->  [Delivery Mechanisms]
  (Gemini API)            (plan -> embeds)       (slash cmd / scheduler)
```

With a **Profile System** feeding user preferences into the generator.

### Target File Structure
```
src/
  config/index.ts                -- Env config (discord + workout + gemini)
  types/workout.ts               -- WorkoutPlan, WorkoutSection, UserProfile
  services/
    workoutGenerator.ts          -- Gemini SDK call + prompt assembly
    workoutScheduler.ts          -- Cron-based daily posting
    profileStore.ts              -- User profile persistence (JSON)
  utils/
    workoutEmbed.ts              -- WorkoutPlan -> Discord Embed
  commands/workout/
    generate.ts                  -- /generate slash command
    profile.ts                   -- /profile set|view|list commands
  server.ts                      -- Entry point, scheduler wiring
scripts/
  deploy-commands.ts             -- Slash command registration
data/
  profiles.json                  -- User profiles
```

### Bot Initialization (src/server.ts)
- Creates a Discord.js client with `Guilds` and `GuildMessages` intents
- Dynamically loads commands from `src/commands/` category folders
- Extends Client type with a `commands` Collection
- Handles `InteractionCreate` event to execute slash commands

### Command Structure
Commands organized in category folders under `src/commands/`. Each file exports:
- `data`: SlashCommandBuilder instance
- `execute`: Async function handling the interaction

### Command Loading
1. Reads all folders in `src/commands/`
2. For each folder, reads all `.ts` files
3. Requires each file and validates `data` + `execute` properties
4. Stores valid commands in `client.commands` Collection

### Type Configuration
- TypeScript strict mode, `NodeNext` module system, ES2016 target
- Runs directly via ts-node (no build step)

## Equipment and Workout Constraints

These are HARD CONSTRAINTS for the AI workout generator prompt:

### Available Equipment
- Squat rig with flat bench
- Barbell + plates up to 300 lbs
- Dumbbells: pair of 25 lbs, one 35 lb, one 50 lb
- Concept 2 BikeErg
- Walking treadmill
- 20 lb weighted vest
- Outdoor running/walking (spring onward)

### Constraints
- LOW CEILINGS -- NO standing overhead movements. Seated on bench or floor only.
- 60-minute max per session (including warm-up)
- DB weight limited to 25 lbs -- use for accessory work, not primary strength

### Workout Structure (every session)
1. Warm-up / stretch (5-10 min)
2. Strength piece (15-25 min, moderate weight)
3. Conditioning piece (15-25 min, HIIT or Zone 2)

### User Profiles
- **Nate**: Advanced lifter, HIIT-focused, lifelong lifting experience, wants Zone 2 cardio days mixed in
- **Wife**: TBD -- preferences to be configured via /profile command

## Implementation Plan

### Phase 1: Foundation (Config, Types, Hardcoded Generator)
- Modify config to add workout + gemini blocks
- Create WorkoutPlan/WorkoutSection/UserProfile types
- Create hardcoded generator stub
- Create /generate slash command
- **Verify:** /generate replies with hardcoded workout text

### Phase 2: AI Integration (Gemini SDK + Prompt Engineering)
- Install @google/generative-ai
- Replace stub with real Gemini Flash calls
- System prompt encodes equipment, ceiling limit, time cap, structure
- JSON response parsing with fallback
- **Verify:** /generate returns real AI workouts respecting all constraints

### Phase 3: Profiles + Rich Embeds
- Profile store (JSON-backed, like weather bot's cityStore)
- /profile set|view|list commands
- Rich embed formatter (color-coded by workout type)
- /generate uses caller's profile
- **Verify:** Personalized workouts in rich embeds

### Phase 4: Scheduled Daily Posts
- Cron scheduler posts for each profile to configured channel
- Wire into server.ts ClientReady event
- **Verify:** Automated daily posts with distinct workouts per profile

### Phase 5: Polish, Variety, Command Registration
- Weekly day-of-week programming variety
- Retry logic on API calls
- /generate cooldown
- deploy-commands.ts script
- **Verify:** Commands in Discord menu, weekly variety, resilience

### Future Vision
- Weekly overview post (Sunday evening)
- /log command for workout tracking
- Progressive overload (AI references past logs)
- /swap to regenerate conditioning piece
