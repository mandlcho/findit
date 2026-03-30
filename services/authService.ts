import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const onAuthChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
