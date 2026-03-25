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

export function buildWeatherEmbed(data: WeatherData): EmbedBuilder {
    const iconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;

    return new EmbedBuilder()
        .setTitle(`${data.city}, ${data.state}`)
        .setDescription(capitalizeDescription(data.description))
        .setThumbnail(iconUrl)
        .setColor(getEmbedColor(data.conditionId))
        .addFields(
            { name: "Temperature", value: `${data.temperature}°F`, inline: true },
            { name: "Feels Like", value: `${data.feelsLike}°F`, inline: true },
            { name: "Humidity", value: `${data.humidity}%`, inline: true },
            { name: "Wind", value: `${data.windSpeed} mph`, inline: true },
        )
        .setTimestamp();
}
