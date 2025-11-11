import type { Location, Place } from '../types';

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    operator?: string;
    brand?: string;
    network?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:postcode'?: string;
    'addr:city'?: string;
  };
}

export async function findAtms(location: Location): Promise<Place[]> {
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

    return data.elements.map((element: OverpassElement): Place => {
      const loc = {
        lat: element.center?.lat || element.lat,
        lng: element.center?.lon || element.lon,
      };
      const addressParts = [
        element.tags?.['addr:street'],
        element.tags?.['addr:housenumber'],
        element.tags?.['addr:postcode'],
        element.tags?.['addr:city'],
      ].filter(Boolean);
      const address =
        addressParts.length > 0 ? addressParts.join(', ').toLowerCase() : 'address not available';

      const name =
        element.tags?.name ||
        element.tags?.operator ||
        element.tags?.brand ||
        element.tags?.network ||
        'atm';

      return {
        id: element.id.toString(),
        name: name.toLowerCase(),
        category: 'atm',
        location: loc,
        address,
        operator: element.tags?.operator?.toLowerCase(),
        network: element.tags?.network?.toLowerCase(),
        brand: element.tags?.brand?.toLowerCase(),
      };
    });
  } catch (error) {
    console.error('error finding atms with openstreetmap api:', error);
    throw new Error('failed to find nearby atms from openstreetmap.');
  }
}
