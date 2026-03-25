import fs from "node:fs";
import path from "node:path";

interface CityEntry {
    city: string;
    state: string;
}

const CITIES_PATH = path.join(__dirname, "../../data/cities.json");

function readCities(): CityEntry[] {
    if (!fs.existsSync(CITIES_PATH)) {
        fs.writeFileSync(CITIES_PATH, "[]", "utf-8");
        return [];
    }
    const raw = fs.readFileSync(CITIES_PATH, "utf-8");
    return JSON.parse(raw);
}

function writeCities(cities: CityEntry[]): void {
    fs.writeFileSync(CITIES_PATH, JSON.stringify(cities, null, 4), "utf-8");
}

export function getCities(): CityEntry[] {
    return readCities();
}

export function addCity(city: string, state: string): { success: boolean; message: string } {
    const cities = readCities();
    const normalized = city.trim().toLowerCase();

    const exists = cities.some((c) => c.city.toLowerCase() === normalized && c.state.toLowerCase() === state.trim().toLowerCase());
    if (exists) {
        return { success: false, message: `${city}, ${state} is already being tracked.` };
    }

    cities.push({ city: city.trim(), state: state.trim().toUpperCase() });
    writeCities(cities);
    return { success: true, message: `Added ${city.trim()}, ${state.trim().toUpperCase()} to the watch list.` };
}

export function removeCity(city: string): { success: boolean; message: string } {
    const cities = readCities();
    const normalized = city.trim().toLowerCase();

    const filtered = cities.filter((c) => c.city.toLowerCase() !== normalized);
    if (filtered.length === cities.length) {
        return { success: false, message: `${city} is not on the watch list.` };
    }

    writeCities(filtered);
    return { success: true, message: `Removed ${city.trim()} from the watch list.` };
}
