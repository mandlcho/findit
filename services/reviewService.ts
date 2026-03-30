import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { Review } from '../types';

const REVIEWS_COLLECTION = 'reviews';
const RATINGS_COLLECTION = 'ratings';

interface RatingAgg {
  totalRating: number;
  count: number;
}

const ensureDb = () => {
  if (!db || !isConfigured) throw new Error('Firebase not configured');
  return db;
};

export const addReview = async (review: Omit<Review, 'id'>): Promise<string> => {
  const firestore = ensureDb();
  const docRef = await addDoc(collection(firestore, REVIEWS_COLLECTION), review);

  // Update rating aggregate
  const ratingRef = doc(firestore, RATINGS_COLLECTION, review.toiletId);
  const ratingSnap = await getDoc(ratingRef);
  if (ratingSnap.exists()) {
    const data = ratingSnap.data() as RatingAgg;
    await setDoc(ratingRef, {
      totalRating: data.totalRating + review.rating,
      count: data.count + 1,
    });
  } else {
    await setDoc(ratingRef, {
      totalRating: review.rating,
      count: 1,
    });
  }

  return docRef.id;
};

export const getReviews = async (toiletId: string): Promise<Review[]> => {
  if (!isConfigured || !db) return [];
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('toiletId', '==', toiletId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
};

export const getRating = async (toiletId: string): Promise<{ average: number; count: number }> => {
  if (!isConfigured || !db) return { average: 0, count: 0 };
  const ratingRef = doc(db, RATINGS_COLLECTION, toiletId);
  const ratingSnap = await getDoc(ratingRef);
  if (!ratingSnap.exists()) {
    return { average: 0, count: 0 };
  }
  const data = ratingSnap.data() as RatingAgg;
  return {
    average: data.count > 0 ? data.totalRating / data.count : 0,
    count: data.count,
  };
};

export const deleteReview = async (reviewId: string, toiletId: string, rating: number): Promise<void> => {
  const firestore = ensureDb();
  await deleteDoc(doc(firestore, REVIEWS_COLLECTION, reviewId));

  // Update rating aggregate
  const ratingRef = doc(firestore, RATINGS_COLLECTION, toiletId);
  const ratingSnap = await getDoc(ratingRef);
  if (ratingSnap.exists()) {
    const data = ratingSnap.data() as RatingAgg;
    const newCount = data.count - 1;
    if (newCount <= 0) {
      await deleteDoc(ratingRef);
    } else {
      await setDoc(ratingRef, {
        totalRating: data.totalRating - rating,
        count: newCount,
      });
    }
  }
};
