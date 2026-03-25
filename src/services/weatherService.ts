import config from "../config";
import { WeatherData } from "../types/weather";

const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

export async function fetchWeather(city: string, state: string = config.weather.defaultState): Promise<WeatherData> {
    const query = state ? `${city},${state},US` : city;
    const url = `${BASE_URL}?q=${encodeURIComponent(query)}&appid=${config.weather.apiKey}&units=imperial`;

    const response = await fetch(url);

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = body?.message || response.statusText;
        throw new Error(`OpenWeather API error: ${message}`);
    }

    const data = await response.json();
    const weather = data.weather[0];

    return {
        city: data.name,
        state,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: weather.description,
        icon: weather.icon,
        windSpeed: Math.round(data.wind.speed),
        conditionId: weather.id,
    };
}
