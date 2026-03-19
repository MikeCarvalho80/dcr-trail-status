/**
 * Calculate sunrise/sunset times for a given latitude, longitude, and date.
 * Uses the NOAA Solar Calculator algorithm (simplified).
 */
export function getSunTimes(lat: number, lng: number, date: Date): { sunrise: string; sunset: string } {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const zenith = 90.833;

  function calcSunTime(rising: boolean): string {
    const lngHour = lng / 15;
    const t = dayOfYear + ((rising ? 6 : 18) - lngHour) / 24;
    const M = 0.9856 * t - 3.289;
    let L = M + 1.916 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 282.634;
    L = ((L % 360) + 360) % 360;
    let RA = Math.atan(0.91764 * Math.tan(L * rad)) / rad;
    RA = ((RA % 360) + 360) % 360;
    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = (RA + (Lquadrant - RAquadrant)) / 15;
    const sinDec = 0.39782 * Math.sin(L * rad);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH =
      (Math.cos(zenith * rad) - sinDec * Math.sin(lat * rad)) /
      (cosDec * Math.cos(lat * rad));
    if (cosH > 1 || cosH < -1) return '--:--';
    let H = Math.acos(cosH) / rad / 15;
    if (rising) H = 24 - H;
    const T = H + RA - 0.06571 * t - 6.622;
    let UT = ((T - lngHour) % 24 + 24) % 24;
    // Convert to local time (approximate via JS Date offset)
    const offset = -date.getTimezoneOffset() / 60;
    let local = UT + offset;
    if (local < 0) local += 24;
    if (local >= 24) local -= 24;
    const hours = Math.floor(local);
    const minutes = Math.round((local - hours) * 60);
    const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  return { sunrise: calcSunTime(true), sunset: calcSunTime(false) };
}
