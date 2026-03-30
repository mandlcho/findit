
export interface Location {
  lat: number;
  lng: number;
}

export type PlaceCategory = 'toilet' | 'atm';

export interface Toilet {
  id: string;
  name: string;
  location: Location;
  address?: string;
  fee?: boolean;
  wheelchair?: boolean;
  diaper?: boolean;
  housedIn?: string;
  category?: PlaceCategory;
  operator?: string;
  network?: string;
  brand?: string;
}

export interface Review {
  id: string;
  toiletId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  text: string;
  createdAt: number;
}

export interface ReviewUser {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}
