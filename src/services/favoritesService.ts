import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';

const LOCAL_STORAGE_KEY = 'isfadur_favorites';

/**
 * Reads local favorites array from localStorage
 */
export function getLocalFavorites(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves favorites array to localStorage
 */
export function setLocalFavorites(favorites: string[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites));
  } catch (err) {
    console.warn('Could not save favorites to localStorage:', err);
  }
}

/**
 * Fetches user favorites from Firestore and API, syncing with local storage
 */
export async function fetchUserFavorites(userUid: string): Promise<string[]> {
  let remoteFavorites: string[] = [];

  // 1. Try fetching from Firestore first
  try {
    const userRef = doc(db, 'users', userUid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.favorites)) {
        remoteFavorites = data.favorites;
      }
    }
  } catch (err) {
    console.warn('Could not read favorites from Firestore, trying API fallback:', err);
  }

  // 2. If Firestore was empty or failed, check API endpoint
  if (remoteFavorites.length === 0) {
    try {
      const res = await fetch(`/api/users/${userUid}/favorites`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.favorites) && data.favorites.length > 0) {
          remoteFavorites = data.favorites;
        }
      }
    } catch (err) {
      console.warn('Could not read favorites from API:', err);
    }
  }

  // 3. Merge with local favorites if any
  const local = getLocalFavorites();
  const merged = Array.from(new Set([...remoteFavorites, ...local]));

  // 4. Update both stores
  setLocalFavorites(merged);
  if (merged.length > remoteFavorites.length) {
    syncFavoritesToRemote(userUid, merged).catch(() => {});
  }

  return merged;
}

/**
 * Syncs the entire favorites array to Firestore and backend API
 */
export async function syncFavoritesToRemote(userUid: string, favorites: string[]): Promise<void> {
  // Sync to Firestore
  try {
    const userRef = doc(db, 'users', userUid);
    await updateDoc(userRef, { favorites });
  } catch (err) {
    try {
      const userRef = doc(db, 'users', userUid);
      await setDoc(userRef, { favorites }, { merge: true });
    } catch (innerErr) {
      console.warn('Could not persist favorites to Firestore:', innerErr);
    }
  }

  // Sync to backend API
  try {
    await fetch(`/api/users/${userUid}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorites })
    });
  } catch (err) {
    console.warn('Could not persist favorites to API:', err);
  }
}

/**
 * Toggles a single favorite listing for an authenticated user
 */
export async function toggleFavorite(
  userUid: string,
  listingId: string
): Promise<{ favorites: string[]; isFavorite: boolean }> {
  const current = getLocalFavorites();
  const isCurrentlySaved = current.includes(listingId);
  const nextFavorites = isCurrentlySaved
    ? current.filter((id) => id !== listingId)
    : [listingId, ...current];

  // Update local
  setLocalFavorites(nextFavorites);

  // Background sync to Firestore and server
  syncFavoritesToRemote(userUid, nextFavorites).catch((err) => {
    console.error('Failed to sync toggled favorite:', err);
  });

  return {
    favorites: nextFavorites,
    isFavorite: !isCurrentlySaved
  };
}

/**
 * Fetches the complete Listing objects for saved advertisement IDs.
 * Gracefully preserves Sold, Paused, or Removed statuses.
 */
export async function fetchSavedListings(
  userUid: string,
  favoriteIds: string[]
): Promise<Listing[]> {
  if (!favoriteIds || favoriteIds.length === 0) {
    return [];
  }

  try {
    const res = await fetch(`/api/users/${userUid}/favorites`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.listings)) {
        return data.listings;
      }
    }
  } catch (err) {
    console.warn('Could not fetch saved listings from bulk API, fetching individually:', err);
  }

  // Fallback: fetch individually with allowArchived=true
  const results: Listing[] = [];
  for (const id of favoriteIds) {
    try {
      const res = await fetch(`/api/listings/${id}?userUid=${encodeURIComponent(userUid)}&allowArchived=true`);
      if (res.ok) {
        const item = await res.json();
        results.push(item);
      }
    } catch {
      // Gracefully continue
    }
  }

  return results;
}
