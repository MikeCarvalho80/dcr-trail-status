/**
 * NWS Weather API — free, no key needed.
 * Fetches forecast for a lat/lng and caches results.
 */

export interface ForecastPeriod {
  name: string;           // "Today", "Tonight", "Saturday"
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;  // "Partly Cloudy", "Rain Likely"
  precipChance: number;   // 0-100
  isDaytime: boolean;
}

export interface ParkWeather {
  current: ForecastPeriod;
  threeDayForecast: ForecastPeriod[]; // next 3 daytime periods
  mudRisk: 'low' | 'medium' | 'high';
}

// Cache: parkId → { data, fetchedAt }
const cache = new Map<string, { data: ParkWeather; fetchedAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Cache: "lat,lng" → forecast URL
const forecastUrlCache = new Map<string, string>();

async function getForecastUrl(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (forecastUrlCache.has(key)) return forecastUrlCache.get(key)!;

  try {
    const res = await fetch(`https://api.weather.gov/points/${lat},${lng}`, {
      headers: { 'User-Agent': 'TrailClear/1.0 (trail status app)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const url = data.properties?.forecast;
    if (url) forecastUrlCache.set(key, url);
    return url ?? null;
  } catch {
    return null;
  }
}

function computeMudRisk(periods: ForecastPeriod[]): 'low' | 'medium' | 'high' {
  // Look at current + next 2 periods for recent/upcoming rain
  const recentPeriods = periods.slice(0, 3);
  const maxPrecip = Math.max(...recentPeriods.map((p) => p.precipChance));
  const hasRainText = recentPeriods.some((p) =>
    /rain|shower|storm|drizzle/i.test(p.shortForecast)
  );

  if (maxPrecip >= 60 || hasRainText) return 'high';
  if (maxPrecip >= 30) return 'medium';
  return 'low';
}

export async function fetchWeather(parkId: string, lat: number, lng: number): Promise<ParkWeather | null> {
  // Check cache
  const cached = cache.get(parkId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  try {
    const forecastUrl = await getForecastUrl(lat, lng);
    if (!forecastUrl) return null;

    const res = await fetch(forecastUrl, {
      headers: { 'User-Agent': 'TrailClear/1.0 (trail status app)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const rawPeriods = data.properties?.periods;
    if (!rawPeriods || rawPeriods.length === 0) return null;

    const periods: ForecastPeriod[] = rawPeriods.map((p: any) => ({
      name: p.name,
      temperature: p.temperature,
      temperatureUnit: p.temperatureUnit,
      windSpeed: p.windSpeed,
      windDirection: p.windDirection,
      shortForecast: p.shortForecast,
      precipChance: p.probabilityOfPrecipitation?.value ?? 0,
      isDaytime: p.isDaytime,
    }));

    const current = periods[0];
    const daytimePeriods = periods.filter((p) => p.isDaytime).slice(0, 4); // today + next 3 days
    const threeDayForecast = daytimePeriods.slice(1, 4); // exclude "today" since it's current

    const weather: ParkWeather = {
      current,
      threeDayForecast,
      mudRisk: computeMudRisk(periods),
    };

    cache.set(parkId, { data: weather, fetchedAt: Date.now() });
    return weather;
  } catch {
    return null;
  }
}
