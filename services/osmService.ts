import type { Location, Toilet } from '../types';

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    operator?: string;
    network?: string;
    brand?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:postcode'?: string;
    'addr:city'?: string;
  };
}

export async function findAtms(location: Location): Promise<Toilet[]> {
  const radiusMeters = 2000;

  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["amenity"="atm"](around:${radiusMeters},${location.lat},${location.lng});
    );
    out;
  `;
  const encodedQuery = encodeURIComponent(overpassQuery);
  const endpoints = [
    `https://overpass-api.de/api/interpreter?data=${encodedQuery}`,
    `https://overpass.kumi.systems/api/interpreter?data=${encodedQuery}`,
  ];

  try {
    let response: Response | null = null;
    for (const url of endpoints) {
      try {
        response = await fetch(url);
        if (response.ok) break;
      } catch {
        continue;
      }
    }
    if (!response || !response.ok) {
      throw new Error(`overpass api failed with status: ${response?.status ?? 'unreachable'}`);
    }

    const data = await response.json();
    if (!data || !data.elements) {
      return [];
    }

    return data.elements
      .map((element: OverpassElement): Toilet | null => {
        const lat = element.center?.lat ?? element.lat;
        const lng = element.center?.lon ?? element.lon;
        if (lat === undefined || lng === undefined) {
          return null;
        }

        const addressParts = [
          element.tags?.['addr:street'],
          element.tags?.['addr:housenumber'],
          element.tags?.['addr:postcode'],
          element.tags?.['addr:city'],
        ].filter(Boolean);

        const name =
          element.tags?.name ||
          element.tags?.operator ||
          element.tags?.brand ||
          element.tags?.network ||
          'atm';

        return {
          id: `atm-${element.id}`,
          name: name.toLowerCase(),
          location: { lat, lng },
          address: addressParts.length ? addressParts.join(', ').toLowerCase() : 'address not available',
          category: 'atm',
          operator: element.tags?.operator?.toLowerCase(),
          network: element.tags?.network?.toLowerCase(),
          brand: element.tags?.brand?.toLowerCase(),
        };
      })
      .filter((item): item is Toilet => Boolean(item));
  } catch (error: any) {
    console.error('error finding atms with openstreetmap api:', error);
    const detail = error?.message || String(error);
    throw new Error(`failed to find nearby atms: ${detail}`);
  }
}
