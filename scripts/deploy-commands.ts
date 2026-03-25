import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import config from "../src/config";

const commands: any[] = [];
const foldersPath = path.join(__dirname, "../src/commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath).default;
        if ("data" in command && "execute" in command) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST().setToken(config.discord.token);

(async () => {
    try {
        console.log(`Registering ${commands.length} slash commands...`);

        await rest.put(
            Routes.applicationGuildCommands(config.discord.client_id, config.discord.guild_id),
            { body: commands }
        );

        console.log(`Successfully registered ${commands.length} commands.`);
    } catch (error) {
        console.error("Failed to register commands:", error);
    }
})();
