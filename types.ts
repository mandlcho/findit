export interface Location {
  lat: number;
  lng: number;
}

export type PlaceCategory = 'toilet' | 'atm';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  location: Location;
  address?: string;
  housedIn?: string;
  fee?: boolean;
  wheelchair?: boolean;
  diaper?: boolean;
  operator?: string;
  network?: string;
  brand?: string;
}
