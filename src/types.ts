export type ListingStatus =
  | 'active'
  | 'sold'
  | 'paused'
  | 'removed_by_admin'
  | 'pending'
  | 'approved'
  | 'rejected';

export interface StatusHistoryEntry {
  status: ListingStatus;
  changedAt: string;
  changedBy: string; // user UID, 'admin', or 'system'
  note?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  recipientUid: string;
  text: string;
  createdAt: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage: string;
  listingDistrict?: string;
  listingArea?: string;
  sellerUid: string;
  sellerName: string;
  buyerUid: string;
  buyerName: string;
  participants: string[]; // [buyerUid, sellerUid]
  lastMessage: string;
  lastMessageAt: string;
  lastSenderUid: string;
  unreadCount?: Record<string, number>; // { [uid: string]: number }
  blockedBy?: string[]; // UIDs of participants who blocked the conversation
  createdAt: string;
  updatedAt: string;
}

export type ReportReason =
  | 'suspected_fraud'
  | 'misleading_info'
  | 'counterfeit_suspicious'
  | 'inappropriate_content'
  | 'duplicate_listing'
  | 'other';

export interface ChatReport {
  id: string;
  conversationId: string;
  messageId?: string;
  reporterUid: string;
  reportedUid: string;
  reason: string;
  details?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export interface ListingReport {
  id: string;
  type?: 'listing' | 'user' | 'chat';
  listingId: string;
  listingTitle?: string;
  sellerUid?: string;
  reporterUid?: string;
  reason: string;
  details?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  actionTaken?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface BlockedUserRecord {
  blockedUid: string;
  blockedName?: string;
  blockedAt: string;
}

export interface ModerationAuditLog {
  id: string;
  adminUid: string;
  action: string;
  targetId: string;
  targetType: 'listing' | 'user' | 'report' | 'conversation';
  reason: string;
  details?: string;
  timestamp: string;
}

export interface Listing {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  price: number;
  isNegotiable: boolean;
  condition: 'Brand New' | 'Used' | 'Like New' | 'Not Applicable';
  description: string;
  district: string;
  area: string;
  sellerName: string;
  sellerPhone: string;
  showPhone?: boolean; // privacy preference: show or hide phone
  allowCalls?: boolean; // privacy preference: allow or disable phone calls
  hasWhatsapp?: boolean;
  images: string[];
  primaryImageIndex?: number;
  status: ListingStatus;
  rejectionReason?: string;
  views: number;
  createdAt: string;
  updatedAt?: string;
  featured?: boolean;
  // Ownership fields
  ownerUid?: string;
  ownerEmail?: string;
  ownerName?: string;
  statusHistory?: StatusHistoryEntry[];
  chatMessages?: ChatMessage[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  createdAt: string;
}

export interface CategoryItem {
  name: string;
  count: number;
}

export interface DistrictItem {
  name: string;
  areas: string[];
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

export interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalViews: number;
}
