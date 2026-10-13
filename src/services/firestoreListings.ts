import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  increment,
} from 'firebase/firestore';
import { db, validateFirestoreConnection } from '../lib/firebase';
import { Listing } from '../types';

const LISTINGS_COLLECTION = 'listings';

/**
 * Migrates existing listings into Firestore without modifying their IDs,
 * keeping approved, pending, and rejected statuses intact.
 */
export async function migrateListingsToFirestore(
  existingListings: Listing[]
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  for (const item of existingListings) {
    try {
      const docRef = doc(db, LISTINGS_COLLECTION, item.id);
      const existingSnap = await getDoc(docRef);

      if (!existingSnap.exists()) {
        await setDoc(docRef, {
          ...item,
          migratedAt: new Date().toISOString(),
        });
        imported++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Failed to migrate listing ${item.id} to Firestore:`, err);
    }
  }

  return { imported, skipped };
}

/**
 * Fetches approved listings from Cloud Firestore.
 */
export async function fetchListingsFromFirestore(options?: {
  category?: string;
  district?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}): Promise<Listing[]> {
  try {
    const isConnected = await validateFirestoreConnection();
    if (!isConnected) {
      throw new Error('Firestore connection offline');
    }

    const colRef = collection(db, LISTINGS_COLLECTION);
    const q = query(colRef, where('status', '==', 'approved'));
    const snapshot = await getDocs(q);

    let results: Listing[] = [];
    snapshot.forEach((snapDoc) => {
      const data = snapDoc.data() as Listing;
      results.push({
        ...data,
        id: snapDoc.id,
      });
    });

    // Apply client-side filters
    if (options?.category && options.category !== 'All') {
      results = results.filter(
        (l) => l.category.toLowerCase() === options.category!.toLowerCase()
      );
    }
    if (options?.district && options.district !== 'All') {
      results = results.filter(
        (l) => l.district.toLowerCase() === options.district!.toLowerCase()
      );
    }
    if (options?.condition && options.condition !== 'All') {
      results = results.filter(
        (l) => l.condition && l.condition.toLowerCase() === options.condition!.toLowerCase()
      );
    }
    if (options?.minPrice !== undefined && !isNaN(options.minPrice)) {
      results = results.filter((l) => l.price >= options.minPrice!);
    }
    if (options?.maxPrice !== undefined && !isNaN(options.maxPrice)) {
      results = results.filter((l) => l.price <= options.maxPrice!);
    }

    // Sorting
    if (options?.sortBy === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (options?.sortBy === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else {
      results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return results;
  } catch (err) {
    console.warn('Falling back to local API listings due to:', err);
    throw err;
  }
}

/**
 * Creates a new listing in Cloud Firestore with 'pending' status.
 */
export async function submitListingToFirestore(
  newListing: Omit<Listing, 'id' | 'views' | 'createdAt' | 'status'>
): Promise<string> {
  const listingId = `isf-${Date.now()}`;
  const docRef = doc(db, LISTINGS_COLLECTION, listingId);

  const fullListing: Listing = {
    ...newListing,
    id: listingId,
    status: 'pending',
    views: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(docRef, fullListing);
  return listingId;
}

/**
 * Increments view count in Cloud Firestore.
 */
export async function incrementListingViewInFirestore(listingId: string): Promise<void> {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, listingId);
    await updateDoc(docRef, {
      views: increment(1),
    });
  } catch (err) {
    // Non-blocking error for view counting
    console.debug('Could not increment view in Firestore:', err);
  }
}
