import type { Location } from '../types';

/** haversine distance between two lat/lng points, in meters */
export function haversineDistance(a: Location, b: Location): number {
  const R = 6371000; // earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** estimated walking time in minutes (assumes 5 km/h) */
export function walkingMinutes(meters: number): number {
  return Math.round(meters / (5000 / 60)); // 5000m per 60min ≈ 83.3m per min
}

/** formatted distance + walking time string, or null if no user location */
export function formatDistance(userLocation: Location | null, targetLocation: Location): string | null {
  if (!userLocation) return null;

  const meters = haversineDistance(userLocation, targetLocation);
  const mins = walkingMinutes(meters);

  const distStr = meters < 1000
    ? `${Math.round(meters)}m away`
    : `${(meters / 1000).toFixed(1)} km away`;

  return `${distStr} · ${mins} min walk`;
}
