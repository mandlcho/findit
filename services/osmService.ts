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
  const bboxDelta = 0.05;
  const south = location.lat - bboxDelta;
  const west = location.lng - bboxDelta;
  const north = location.lat + bboxDelta;
  const east = location.lng + bboxDelta;

  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="atm"](${south},${west},${north},${east});
      way["amenity"="atm"](${south},${west},${north},${east});
      relation["amenity"="atm"](${south},${west},${north},${east});
    );
    out center;
  `;
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const response = await fetch(overpassUrl);
    if (!response.ok) {
      throw new Error(`overpass api failed with status: ${response.status}`);
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
  } catch (error) {
    console.error('error finding atms with openstreetmap api:', error);
    throw new Error('failed to find nearby atms from openstreetmap.');
  }
}
