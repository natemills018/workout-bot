import { EmbedBuilder } from "discord.js";
import { WeatherData } from "../types/weather";

function getEmbedColor(conditionId: number): number {
    if (conditionId >= 200 && conditionId < 300) return 0x7b2d8b; // Thunderstorm - purple
    if (conditionId >= 300 && conditionId < 400) return 0x5b9bd5; // Drizzle - light blue
    if (conditionId >= 500 && conditionId < 600) return 0x2e5fa1; // Rain - blue
    if (conditionId >= 600 && conditionId < 700) return 0xd6e4f0; // Snow - pale blue
    if (conditionId >= 700 && conditionId < 800) return 0x9e9e9e; // Atmosphere (fog/haze) - gray
    if (conditionId === 800) return 0xf5a623;                      // Clear - orange
    if (conditionId > 800) return 0xb0bec5;                        // Clouds - blue-gray
    return 0x4a90d9;                                                // Default - blue
}

function capitalizeDescription(description: string): string {
    return description.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getConditionEmoji(conditionId: number): string {
    if (conditionId >= 200 && conditionId < 300) return "thunderstorm";
    if (conditionId >= 300 && conditionId < 400) return "drizzle";
    if (conditionId >= 500 && conditionId < 600) return "rain";
    if (conditionId >= 600 && conditionId < 700) return "snow";
    if (conditionId >= 700 && conditionId < 800) return "haze";
    if (conditionId === 800) return "clear skies";
    if (conditionId > 800) return "cloudy";
    return "";
}

export function buildWeatherEmbed(data: WeatherData): EmbedBuilder {
    const iconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    const condition = getConditionEmoji(data.conditionId);

    const description = [
        `# ${data.temperature}°F`,
        `**${capitalizeDescription(data.description)}** — ${condition}`,
        "",
        `Feels like **${data.feelsLike}°F** | Humidity **${data.humidity}%** | Wind **${data.windSpeed} mph**`,
    ].join("\n");

    return new EmbedBuilder()
        .setAuthor({ name: `${data.city}, ${data.state}` })
        .setDescription(description)
        .setThumbnail(iconUrl)
        .setColor(getEmbedColor(data.conditionId))
        .setTimestamp();
}
