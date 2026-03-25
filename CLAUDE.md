# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Discord bot built with discord.js v14 that provides weather information and other utilities through slash commands. The bot is written in TypeScript and uses ts-node for development.

## Development Commands

- **Run the bot**: `npm run dev`
  - Uses ts-node to execute `src/server.ts` directly without compilation
  - This is the primary command for development and testing

## Environment Configuration

The bot requires a `.env` file in the project root with the following environment variables:
- `DISCORD_APP_ID` - Discord application ID
- `DISCORD_PUB_KEY` - Discord public key
- `DISCORD_CLIENT_ID` - Discord client ID
- `DISCORD_CLIENT_SECRET` - Discord client secret
- `DISCORD_TOKEN` - Discord bot token (required)
- `DISCORD_GUILD_ID` - Discord guild/server ID (required)
- `OPENWEATHER_API_KEY` - OpenWeather API key (required)

All Discord-related environment variables are accessed through `src/config/index.ts`.

## Architecture

### Bot Initialization (src/server.ts)
- Creates a Discord.js client with `GuildMessages` intent
- Dynamically loads commands from the `src/commands/` directory
- Extends the Client type with a `commands` Collection to store loaded commands
- Handles the `InteractionCreate` event to execute slash commands

### Command Structure
Commands are organized in category folders under `src/commands/`:
- `src/commands/test/` - Test commands
- `src/commands/utils/` - Utility commands (e.g., weather)

Each command file must export a default object with:
- `data`: SlashCommandBuilder instance defining the command's name and description
- `execute`: Async function that handles the command interaction

Example command structure:
```typescript
export default {
    data: new SlashCommandBuilder().setName("commandname").setDescription("description"),
    async execute(interaction: any) {
        await interaction.reply("response");
    },
};
```

### Command Loading
The bot uses a folder-based command loading system:
1. Reads all folders in `src/commands/`
2. For each folder, reads all `.ts` files
3. Requires each file and validates it has `data` and `execute` properties
4. Stores valid commands in `client.commands` Collection by command name

### Type Configuration
- Uses TypeScript with strict mode enabled
- Module system: `NodeNext` (ES modules with Node.js resolution)
- Target: ES2016
- Runs TypeScript directly via ts-node (no build step in development)

## Adding New Commands

1. Create a new `.ts` file in an appropriate category folder under `src/commands/`
2. Export a default object with `data` (SlashCommandBuilder) and `execute` (async function)
3. The command will be automatically loaded when the bot starts
4. Commands must be registered with Discord separately (not handled by this codebase currently)
