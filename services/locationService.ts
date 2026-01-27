import type { Location, Toilet } from '../types';

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
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:postcode'?: string;
    'addr:city'?: string;
    railway?: string;
    toilets?: string;
    amenity?: string;
    fee?: string;
    wheelchair?: string;
    diaper?: string;
  };
  nodes?: number[];
}

export async function findToilets(location: Location): Promise<Toilet[]> {
  const bboxDelta = 0.05; 
  const south = location.lat - bboxDelta;
  const west = location.lng - bboxDelta;
  const north = location.lat + bboxDelta;
  const east = location.lng + bboxDelta;

  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="toilets"](${south},${west},${north},${east});
      way["amenity"="toilets"](${south},${west},${north},${east});
      relation["amenity"="toilets"](${south},${west},${north},${east});
      node["railway"="station"]["toilets"="yes"](${south},${west},${north},${east});
      way["railway"="station"]["toilets"="yes"](${south},${west},${north},${east});
      relation["railway"="station"]["toilets"="yes"](${south},${west},${north},${east});
    )->.features;
    node.features->.feature_nodes;
    (
      .feature_nodes <;
    )->.parents;
    (.features; .parents;);
    out center;
  `;
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const response = await fetch(overpassUrl);
    if (!response.ok) {
      throw new Error(`overpass api failed with status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data && data.elements) {
      const elements: OverpassElement[] = data.elements;

      const parentNameMap = new Map<number, string>();
      const ways = elements.filter(e => e.type === 'way' && e.tags?.name && e.nodes);
      for (const way of ways) {
        for (const nodeId of way.nodes!) {
          if (!parentNameMap.has(nodeId)) {
            parentNameMap.set(nodeId, way.tags!.name!);
          }
        }
      }
      
      const toiletElements = elements.filter(e => 
        e.tags?.amenity === 'toilets' || (e.tags?.railway === 'station' && e.tags?.toilets === 'yes')
      );

      return toiletElements.map((element: OverpassElement): Toilet => {
        const loc = {
            lat: element.center?.lat || element.lat,
            lng: element.center?.lon || element.lon
        };
        const addressParts = [
            element.tags?.['addr:street'],
            element.tags?.['addr:housenumber'],
            element.tags?.['addr:postcode'],
            element.tags?.['addr:city']
        ].filter(Boolean);
        
        let name = 'public toilet';
        let housedIn: string | undefined = undefined;
        
        if (element.tags?.railway === 'station') {
          name = element.tags.name ? `${element.tags.name} station toilet` : 'station toilet';
        } else if (element.tags?.name) {
          name = element.tags.name;
        }

        if (element.type === 'node' && parentNameMap.has(element.id)) {
            housedIn = parentNameMap.get(element.id)!;
        }
        
        const address = addressParts.length > 0 ? addressParts.join(', ') : 'address not available';

        return {
          id: element.id.toString(),
          name: name.toLowerCase(),
          category: 'toilet',
          location: loc,
          address: address.toLowerCase(),
          housedIn: housedIn?.toLowerCase(),
          fee: element.tags?.fee === 'no' || element.tags?.fee === '0',
          wheelchair: element.tags?.wheelchair === 'yes',
          diaper: element.tags?.diaper === 'yes',
        };
      });
    }
    return [];

  } catch (error) {
    console.error("error finding toilets with openstreetmap api:", error);
    throw new Error("failed to find nearby toilets from openstreetmap.");
  }
}

const REVERSE_GEOCODE_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const REVERSE_GEOCODE_PRECISION = 5; // ~1m-ish, good enough for POI address labels

type ReverseGeocodeCacheEntry = {
  value: string;
  expiresAt: number;
};

const reverseGeocodeCache = new Map<string, ReverseGeocodeCacheEntry>();
const reverseGeocodeInFlight = new Map<string, Promise<string>>();

function roundCoord(value: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function reverseGeocodeCacheKey(location: Location) {
  const lat = roundCoord(location.lat, REVERSE_GEOCODE_PRECISION);
  const lng = roundCoord(location.lng, REVERSE_GEOCODE_PRECISION);
  return `${lat},${lng}`;
}

function pruneReverseGeocodeCache(now: number) {
  for (const [key, entry] of reverseGeocodeCache.entries()) {
    if (entry.expiresAt <= now) reverseGeocodeCache.delete(key);
  }
}

export async function reverseGeocode(location: Location): Promise<string> {
  const key = reverseGeocodeCacheKey(location);
  const now = Date.now();

  pruneReverseGeocodeCache(now);

  const cached = reverseGeocodeCache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const inFlight = reverseGeocodeInFlight.get(key);
  if (inFlight) return inFlight;

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&addressdetails=1`;

  const requestPromise = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          // Note: browsers prevent overriding User-Agent. Kept here for non-browser runtimes
          // and to document intent for Nominatim usage policy compliance.
          'User-Agent': 'findit/0.1 (https://github.com/mandlcho/findit)',
          'Referer': window.location.origin,
        },
      });

      if (!response.ok) {
        throw new Error(`nominatim api failed with status: ${response.status}`);
      }

      const data = await response.json();

      let result = "could not determine address";

      if (data && data.address) {
        const adr = data.address;
        const parts: string[] = [];
        if (adr.house_number) parts.push(adr.house_number);
        if (adr.road) parts.push(adr.road);
        if (adr.suburb) parts.push(adr.suburb);

        if (adr.city && adr.city.toLowerCase() === 'singapore') {
          if (adr.postcode) {
            parts.push(`singapore ${adr.postcode}`);
          } else {
            parts.push('singapore');
          }
        } else {
          if (adr.city) parts.push(adr.city);
          if (adr.postcode) parts.push(adr.postcode);
        }

        const uniqueAddressParts = [...new Set(parts)];
        if (uniqueAddressParts.length > 0) {
          result = uniqueAddressParts.join(', ').toLowerCase();
        }
      } else if (data?.display_name) {
        result = String(data.display_name).toLowerCase();
      } else if (data?.error) {
        console.error("nominatim api error:", data.error);
        result = `location lookup failed: ${data.error}`.toLowerCase();
      }

      reverseGeocodeCache.set(key, {
        value: result,
        expiresAt: now + REVERSE_GEOCODE_TTL_MS,
      });

      return result;
    } catch (error) {
      console.error("error with openstreetmap reverse geocoding:", error);
      return "unknown location (network error)";
    } finally {
      reverseGeocodeInFlight.delete(key);
    }
  })();

  reverseGeocodeInFlight.set(key, requestPromise);
  return requestPromise;
}
