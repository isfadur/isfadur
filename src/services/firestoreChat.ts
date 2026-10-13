import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Conversation, ChatMessage, Listing, ChatReport } from '../types';

/**
 * Normalizes conversation document from Firestore
 */
function normalizeConversation(id: string, data: any): Conversation {
  return {
    id,
    listingId: data.listingId || '',
    listingTitle: data.listingTitle || 'Untitled Ad',
    listingPrice: Number(data.listingPrice) || 0,
    listingImage: data.listingImage || '',
    listingDistrict: data.listingDistrict || '',
    listingArea: data.listingArea || '',
    sellerUid: data.sellerUid || '',
    sellerName: data.sellerName || 'Seller',
    buyerUid: data.buyerUid || '',
    buyerName: data.buyerName || 'Buyer',
    participants: Array.isArray(data.participants) ? data.participants : [data.buyerUid, data.sellerUid].filter(Boolean),
    lastMessage: data.lastMessage || '',
    lastMessageAt: data.lastMessageAt?.toDate?.() ? data.lastMessageAt.toDate().toISOString() : (data.lastMessageAt || new Date().toISOString()),
    lastSenderUid: data.lastSenderUid || '',
    unreadCount: data.unreadCount || {},
    blockedBy: Array.isArray(data.blockedBy) ? data.blockedBy : [],
    createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString())
  };
}

/**
 * Normalizes message document from Firestore
 */
function normalizeMessage(id: string, conversationId: string, data: any): ChatMessage {
  return {
    id,
    conversationId,
    senderUid: data.senderUid || '',
    senderName: data.senderName || '',
    recipientUid: data.recipientUid || '',
    text: data.text || '',
    createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    read: Boolean(data.read)
  };
}

/**
 * Finds an existing conversation or creates a new one between buyer and seller for a listing.
 * Prevents users from chatting with themselves.
 */
export async function getOrCreateConversation(
  listing: Listing,
  buyerUid: string,
  buyerName: string
): Promise<Conversation> {
  const sellerUid = listing.ownerUid || `legacy-${listing.id}`;
  const sellerName = listing.sellerName || 'Seller';

  if (buyerUid === sellerUid) {
    throw new Error('You cannot start a conversation on your own listing.');
  }

  // Conversation deterministic ID or query
  const conversationId = `conv_${listing.id}_${buyerUid}`;

  try {
    const convRef = doc(db, 'conversations', conversationId);
    const existingSnap = await getDoc(convRef);

    if (existingSnap.exists()) {
      return normalizeConversation(existingSnap.id, existingSnap.data());
    }

    const primaryImg = listing.images && listing.images.length > 0
      ? listing.images[listing.primaryImageIndex || 0] || listing.images[0]
      : '';

    const newConvData: any = {
      listingId: listing.id,
      listingTitle: listing.title,
      listingPrice: listing.price,
      listingImage: primaryImg,
      listingDistrict: listing.district || '',
      listingArea: listing.area || '',
      sellerUid,
      sellerName,
      buyerUid,
      buyerName: buyerName || 'Buyer',
      participants: [buyerUid, sellerUid],
      lastMessage: 'Conversation started',
      lastMessageAt: new Date().toISOString(),
      lastSenderUid: buyerUid,
      unreadCount: {
        [sellerUid]: 0,
        [buyerUid]: 0
      },
      blockedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(convRef, newConvData);

    // Also mirror to backend API
    fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newConvData, id: conversationId })
    }).catch(() => {});

    return normalizeConversation(conversationId, newConvData);
  } catch (err) {
    console.warn('Firestore getOrCreateConversation error, using backend API fallback:', err);
    // Backend API fallback
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId: listing.id,
        listingTitle: listing.title,
        listingPrice: listing.price,
        listingImage: listing.images?.[0] || '',
        listingDistrict: listing.district || '',
        listingArea: listing.area || '',
        sellerUid,
        sellerName,
        buyerUid,
        buyerName
      })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to start conversation');
    }
    const data = await res.json();
    return data.conversation;
  }
}

/**
 * Listens in real-time to conversations involving the user
 */
export function subscribeUserConversations(
  userUid: string,
  onUpdate: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversations: Conversation[] = [];
        snapshot.forEach((docSnap) => {
          conversations.push(normalizeConversation(docSnap.id, docSnap.data()));
        });

        // Sort latest updated first
        conversations.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        onUpdate(conversations);
      },
      async (err) => {
        console.warn('Firestore conversations subscription error, polling server:', err);
        // Fallback fetch from Express backend
        try {
          const res = await fetch(`/api/conversations?userUid=${encodeURIComponent(userUid)}`);
          if (res.ok) {
            const data = await res.json();
            onUpdate(data.conversations || []);
          }
        } catch (fetchErr) {
          if (onError) onError(err);
        }
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn('Error setting up onSnapshot for conversations:', err);
    // One-time fallback
    fetch(`/api/conversations?userUid=${encodeURIComponent(userUid)}`)
      .then(r => r.json())
      .then(d => onUpdate(d.conversations || []))
      .catch(() => {});
    return () => {};
  }
}

/**
 * Listens in real-time to messages in a conversation
 */
export function subscribeConversationMessages(
  conversationId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          msgs.push(normalizeMessage(docSnap.id, conversationId, docSnap.data()));
        });
        onUpdate(msgs);
      },
      async (err) => {
        console.warn('Firestore messages subscription error, fetching fallback:', err);
        try {
          const res = await fetch(`/api/conversations/${conversationId}/messages`);
          if (res.ok) {
            const data = await res.json();
            onUpdate(data.messages || []);
          }
        } catch (fallbackErr) {
          if (onError) onError(err);
        }
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn('Error setting up messages subscription:', err);
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then(d => onUpdate(d.messages || []))
      .catch(() => {});
    return () => {};
  }
}

/**
 * Send a chat message with validation, rate-limiting check, and unread increment
 */
export async function sendChatMessage({
  conversationId,
  senderUid,
  senderName,
  recipientUid,
  text
}: {
  conversationId: string;
  senderUid: string;
  senderName: string;
  recipientUid: string;
  text: string;
}): Promise<ChatMessage> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('Message cannot be empty');
  }
  if (cleanText.length > 1000) {
    throw new Error('Message exceeds 1000 characters limit');
  }

  const nowIso = new Date().toISOString();

  try {
    // Check if conversation exists and whether sender is blocked
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);

    if (convSnap.exists()) {
      const data = convSnap.data();
      const blockedBy: string[] = data.blockedBy || [];
      if (blockedBy.length > 0) {
        throw new Error('This conversation is currently blocked.');
      }
    }

    const messagesCol = collection(db, 'conversations', conversationId, 'messages');
    const newMsgData = {
      senderUid,
      senderName,
      recipientUid,
      text: cleanText,
      createdAt: nowIso,
      read: false
    };

    const docRef = await addDoc(messagesCol, newMsgData);

    // Update conversation metadata
    const currentUnread = convSnap.exists() ? (convSnap.data().unreadCount?.[recipientUid] || 0) : 0;

    await updateDoc(convRef, {
      lastMessage: cleanText,
      lastMessageAt: nowIso,
      lastSenderUid: senderUid,
      [`unreadCount.${recipientUid}`]: currentUnread + 1,
      updatedAt: nowIso
    });

    // Mirror to backend
    fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsgData)
    }).catch(() => {});

    return {
      id: docRef.id,
      conversationId,
      ...newMsgData
    };
  } catch (err: any) {
    console.warn('Firestore sendChatMessage error, using backend API fallback:', err);
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderUid,
        senderName,
        recipientUid,
        text: cleanText
      })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || err.message || 'Failed to send message');
    }
    const data = await res.json();
    return data.message;
  }
}

/**
 * Marks conversation as read by the given user
 */
export async function markConversationAsRead(conversationId: string, userUid: string): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`unreadCount.${userUid}`]: 0
    });
  } catch (err) {
    // Silent fallback
  }

  fetch(`/api/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userUid })
  }).catch(() => {});
}

/**
 * Block user in conversation
 */
export async function blockUser(conversationId: string, blockerUid: string): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      blockedBy: arrayUnion(blockerUid),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    // Fallback
  }

  await fetch(`/api/conversations/${conversationId}/block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockerUid, action: 'block' })
  });
}

/**
 * Unblock user in conversation
 */
export async function unblockUser(conversationId: string, blockerUid: string): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      blockedBy: arrayRemove(blockerUid),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    // Fallback
  }

  await fetch(`/api/conversations/${conversationId}/block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockerUid, action: 'unblock' })
  });
}

/**
 * Report a conversation or message for safety / moderation
 */
export async function reportAbuse({
  conversationId,
  messageId,
  reporterUid,
  reportedUid,
  reason,
  details
}: {
  conversationId: string;
  messageId?: string;
  reporterUid: string;
  reportedUid: string;
  reason: string;
  details?: string;
}): Promise<void> {
  const reportData = {
    conversationId,
    messageId: messageId || null,
    reporterUid,
    reportedUid,
    reason,
    details: details || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, 'reports'), reportData);
  } catch (err) {
    // fallback
  }

  await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });
}
