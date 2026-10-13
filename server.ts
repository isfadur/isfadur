import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Secure Admin Secret strictly from environment configuration
const ADMIN_SECRET = process.env.ADMIN_PASSWORD;
// Active admin session tokens
const activeSessions = new Set<string>();

// Ensure data directories exist
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'listings.json');
const CONVERSATIONS_FILE = path.resolve(DATA_DIR, 'conversations.json');
const MESSAGES_FILE = path.resolve(DATA_DIR, 'messages.json');
const USER_FAVORITES_FILE = path.resolve(DATA_DIR, 'user_favorites.json');
const REPORTS_FILE = path.resolve(DATA_DIR, 'reports.json');
const BLOCKED_USERS_FILE = path.resolve(DATA_DIR, 'blocked_users.json');
const AUDIT_LOGS_FILE = path.resolve(DATA_DIR, 'moderation_audit_logs.json');
const RESTRICTED_USERS_FILE = path.resolve(DATA_DIR, 'restricted_users.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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
  changedBy: string;
  note?: string;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface ListingReport {
  id: string;
  type?: 'listing' | 'user' | 'chat';
  listingId?: string;
  listingTitle?: string;
  sellerUid?: string;
  conversationId?: string;
  messageId?: string;
  reportedUid?: string;
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
  showPhone?: boolean; // Privacy preference
  allowCalls?: boolean; // Privacy preference
  hasWhatsapp?: boolean;
  images: string[];
  primaryImageIndex?: number;
  status: ListingStatus;
  rejectionReason?: string;
  views: number;
  createdAt: string;
  updatedAt?: string;
  featured?: boolean;
  ownerUid?: string;
  ownerEmail?: string;
  ownerName?: string;
  statusHistory?: StatusHistoryEntry[];
  chatMessages?: ChatMessage[];
}

// Strict public sanitizer for seller contact privacy
function sanitizeListingForPublic(listing: Listing, requesterUid?: string | null, isAdmin?: boolean): Listing {
  const isOwner = Boolean(requesterUid && listing.ownerUid && requesterUid === listing.ownerUid);
  // Owner and admin can always view all details
  if (isOwner || isAdmin) {
    return listing;
  }
  // If showPhone is false, strictly omit phone number from public response
  if (listing.showPhone === false) {
    const { sellerPhone, ...rest } = listing;
    return {
      ...rest,
      sellerPhone: '', // Concealed by seller preference
      showPhone: false,
      allowCalls: false,
    };
  }
  return listing;
}

// Initial seed data with authentic Bangladeshi listings
const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'isf-101',
    title: 'iPhone 14 Pro 128GB Deep Purple - Official BD BTRC',
    category: 'Mobiles & Electronics',
    price: 92000,
    isNegotiable: true,
    condition: 'Like New',
    description: 'Battery health 91%. Dual physical SIM. Original box, memo and fast cable included. Used with case and tempered glass since day 1. Selling because upgrading to 16 Pro.',
    district: 'Dhaka',
    area: 'Gulshan 2',
    sellerName: 'Tanvir Hossain',
    sellerPhone: '01711223344',
    hasWhatsapp: true,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'approved',
    views: 142,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    featured: true
  },
  {
    id: 'isf-102',
    title: 'Yamaha FZS V3 Deluxe (Matte Black) - 2023 Model',
    category: 'Vehicles',
    price: 245000,
    isNegotiable: true,
    condition: 'Used',
    description: 'Ran 11,200 km only. First party owner, digital smart card, 2 years BRTA registration with tax token updated till Dec 2026. Motul engine oil used regularly. No accidental history.',
    district: 'Dhaka',
    area: 'Mirpur 10',
    sellerName: 'Rafiqul Islam',
    sellerPhone: '01819876543',
    hasWhatsapp: true,
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'approved',
    views: 89,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    featured: true
  },
  {
    id: 'isf-103',
    title: '3-Bed Family Apartment 1450 Sft Ready for Rent',
    category: 'Property',
    price: 32000,
    isNegotiable: false,
    condition: 'Not Applicable',
    description: '3 bedrooms, 3 attached washrooms, 2 wide verandas, drawing, dining, kitchen with cabinet. 5th floor with lift & 24/7 generator backup, CCTV, and car parking space.',
    district: 'Dhaka',
    area: 'Uttara Sector 11',
    sellerName: 'Engineer Enamul Haque',
    sellerPhone: '01912345670',
    hasWhatsapp: true,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'approved',
    views: 215,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    featured: true
  },
  {
    id: 'isf-104',
    title: 'Pure Jamdani Handloom Saree (84 Count)',
    category: 'Fashion & Clothing',
    price: 6500,
    isNegotiable: false,
    condition: 'Brand New',
    description: 'Authentic Demra Rupganj handloom weaving. Premium cotton-silk mix with traditional floral kalka motif. Comes with matching blouse piece in presentation box.',
    district: 'Narayanganj',
    area: 'Rupganj',
    sellerName: 'Nusrat Jahan',
    sellerPhone: '01611002233',
    hasWhatsapp: true,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'approved',
    views: 64,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'isf-105',
    title: 'Senior MERN Stack Developer (Remote / Hybrid)',
    category: 'Jobs',
    price: 85000,
    isNegotiable: true,
    condition: 'Not Applicable',
    description: 'Leading software agency hiring developer with 3+ years in React, Node.js, TypeScript, PostgreSQL. 5 days work week, festival bonuses, medical insurance.',
    district: 'Chattogram',
    area: 'Agrabad',
    sellerName: 'TechVision BD HR',
    sellerPhone: '01715566778',
    hasWhatsapp: false,
    images: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'approved',
    views: 310,
    createdAt: new Date(Date.now() - 3600000 * 55).toISOString()
  },
  {
    id: 'isf-106',
    title: 'Solid Chittagong Teak (Segun) Dining Table with 6 Chairs',
    category: 'Home & Living',
    price: 48000,
    isNegotiable: true,
    condition: 'Like New',
    description: '100% seasoned Chittagong Teak wood. Hand carved borders with 10mm tempered glass top. Mint condition, only 1 year old. Relocating abroad so urgent sell.',
    district: 'Chattogram',
    area: 'Nasirabad',
    sellerName: 'Kamal Uddin',
    sellerPhone: '01811445566',
    hasWhatsapp: true,
    images: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'approved',
    views: 73,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'isf-107',
    title: 'Split Inverter AC Installation & Deep Servicing',
    category: 'Services',
    price: 1500,
    isNegotiable: false,
    condition: 'Not Applicable',
    description: 'Certified HVAC technicians. Pressure washer jet clean, refrigerant gas top up, outdoor bracket mount, copper piping with 30 days service warranty.',
    district: 'Sylhet',
    area: 'Zindabazar',
    sellerName: 'CoolAir Express',
    sellerPhone: '01719988776',
    hasWhatsapp: true,
    images: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'approved',
    views: 52,
    createdAt: new Date(Date.now() - 3600000 * 90).toISOString()
  },
  {
    id: 'isf-108',
    title: 'Wholesale Rajshahi Pure Mustard Oil (Ghani Vanga)',
    category: 'Local Businesses',
    price: 240,
    isNegotiable: true,
    condition: 'Brand New',
    description: '100% cold pressed wooden ghani sarisha tel directly from Bagha, Rajshahi. Available in 1L, 2L, 5L cans. Wholesale supply available for grocery shops.',
    district: 'Rajshahi',
    area: 'Saheb Bazar',
    sellerName: 'Al-Madina Agro',
    sellerPhone: '01712211445',
    hasWhatsapp: true,
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'approved',
    views: 45,
    createdAt: new Date(Date.now() - 3600000 * 110).toISOString()
  },
  {
    id: 'isf-109',
    title: 'Sony Alpha A7 III Mirrorless Camera with 28-70mm Lens',
    category: 'Mobiles & Electronics',
    price: 115000,
    isNegotiable: true,
    condition: 'Used',
    description: 'Shutter count only 14,000. Sensor pristine clean. Includes 2 original Sony batteries, dual charger, Sandisk Extreme Pro 128GB SD card. Ready for review.',
    district: 'Dhaka',
    area: 'Dhanmondi',
    sellerName: 'Farhan Kabir',
    sellerPhone: '01710998877',
    hasWhatsapp: true,
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'
    ],
    status: 'pending',
    views: 12,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// Helper to read database
function readListings(): Listing[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading listings database:', err);
  }
  // Initialize file with seed data
  saveListings(INITIAL_LISTINGS);
  return INITIAL_LISTINGS;
}

// Helper to write database atomically
function saveListings(listings: Listing[]) {
  const tempPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(listings, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_FILE);
}

// Moderation & Trust Data Helpers
function readReports(): ListingReport[] {
  if (!fs.existsSync(REPORTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveReports(reports: ListingReport[]): void {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
}

function readBlockedUsers(): Record<string, BlockedUserRecord[]> {
  if (!fs.existsSync(BLOCKED_USERS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(BLOCKED_USERS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveBlockedUsers(data: Record<string, BlockedUserRecord[]>): void {
  fs.writeFileSync(BLOCKED_USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function isUserBlockedBidirectional(uid1?: string, uid2?: string): boolean {
  if (!uid1 || !uid2 || uid1 === uid2) return false;
  const blocks = readBlockedUsers();
  const list1 = blocks[uid1] || [];
  const list2 = blocks[uid2] || [];
  return list1.some(b => b.blockedUid === uid2) || list2.some(b => b.blockedUid === uid1);
}

function readRestrictedUsers(): string[] {
  if (!fs.existsSync(RESTRICTED_USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(RESTRICTED_USERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveRestrictedUsers(uids: string[]): void {
  fs.writeFileSync(RESTRICTED_USERS_FILE, JSON.stringify(uids, null, 2), 'utf-8');
}

function isUserRestricted(uid?: string): boolean {
  if (!uid) return false;
  const restricted = readRestrictedUsers();
  return restricted.includes(uid);
}

function readAuditLogs(): ModerationAuditLog[] {
  if (!fs.existsSync(AUDIT_LOGS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function recordAuditLog(entry: Omit<ModerationAuditLog, 'id' | 'timestamp'>): ModerationAuditLog {
  const logs = readAuditLogs();
  const newLog: ModerationAuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  logs.unshift(newLog);
  fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  return newLog;
}

// Middleware for parsing JSON with generous limit for compressed client images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded image files
app.use('/uploads', express.static(UPLOADS_DIR));

// Admin authentication middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeSessions.has(token)) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired session' });
  }
  next();
}

// --- PUBLIC API ROUTES ---

// 1. Get categories with current active counts
app.get('/api/categories', (req, res) => {
  const listings = readListings();
  const activeListings = listings.filter(l => l.status === 'active' || l.status === 'approved');
  
  const categoryList = [
    'Mobiles & Electronics',
    'Fashion & Clothing',
    'Home & Living',
    'Vehicles',
    'Property',
    'Jobs',
    'Services',
    'Local Businesses',
    'Other'
  ];

  const results = categoryList.map(cat => ({
    name: cat,
    count: activeListings.filter(l => l.category === cat).length
  }));

  res.json({ categories: results, totalApproved: activeListings.length });
});

// 2. Get districts list for Bangladesh
app.get('/api/districts', (req, res) => {
  const districts = [
    { name: 'Dhaka', areas: ['Mirpur', 'Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mohammadpur', 'Motijheel', 'Bashundhara R/A', 'Badda', 'Old Dhaka'] },
    { name: 'Chattogram', areas: ['Agrabad', 'GEC Circle', 'Nasirabad', 'Panchlaish', 'Halishahar', 'Khulshi', 'Chawkbazar'] },
    { name: 'Sylhet', areas: ['Zindabazar', 'Amberkhana', 'Shibgonj', 'Upashahar', 'Mirabazar', 'Shahjalal Upashahar'] },
    { name: 'Rajshahi', areas: ['Saheb Bazar', 'Motihar', 'Kazla', 'Boalia', 'Shiroil'] },
    { name: 'Khulna', areas: ['Boyra', 'Khalishpur', 'Sonadanga', 'Daulatpur', 'Shibbari'] },
    { name: 'Barishal', areas: ['Sadar Road', 'Natun Bazar', 'Rupatali', 'Batajor'] },
    { name: 'Rangpur', areas: ['Jahaj Company More', 'Modern More', 'Dhap', 'Carmichael College Road'] },
    { name: 'Mymensingh', areas: ['Ganginar Par', 'Charpara', 'Notun Bazar', 'Town Hall'] },
    { name: 'Gazipur', areas: ['Tongi', 'Board Bazar', 'Chowrasta', 'Joydebpur'] },
    { name: 'Narayanganj', areas: ['Chasara', 'Bandar', 'Fatullah', 'Rupganj'] },
    { name: 'Cumilla', areas: ['Kandirpar', 'Tomsom Bridge', 'Badurtala', 'Shasongachha'] },
    { name: 'Bogura', areas: ['Satmatha', 'Jaleshitola', 'Colony', 'Sherpur'] },
    { name: 'Cox\'s Bazar', areas: ['Kolatoli', 'Laboni Beach', 'Main Road', 'Teknaf Road'] }
  ];
  res.json(districts);
});

// 3. Search and browse active & approved listings (Sold and Paused are hidden from public)
app.get('/api/listings', (req, res) => {
  const { category, district, area, q, sort = 'latest', page = '1', limit = '12', minPrice, maxPrice, condition } = req.query;
  const listings = readListings();
  
  // Only public active and legacy approved listings
  let filtered = listings.filter(l => l.status === 'active' || l.status === 'approved');

  if (category && typeof category === 'string' && category !== 'All') {
    filtered = filtered.filter(l => l.category.toLowerCase() === category.toLowerCase());
  }

  if (district && typeof district === 'string' && district !== 'All') {
    filtered = filtered.filter(l => l.district.toLowerCase() === district.toLowerCase());
  }

  if (area && typeof area === 'string' && area !== 'All') {
    filtered = filtered.filter(l => l.area.toLowerCase() === area.toLowerCase());
  }

  if (condition && typeof condition === 'string' && condition !== 'All') {
    filtered = filtered.filter(l => l.condition && l.condition.toLowerCase() === condition.toLowerCase());
  }

  if (minPrice !== undefined && minPrice !== '' && !isNaN(Number(minPrice))) {
    filtered = filtered.filter(l => l.price >= Number(minPrice));
  }

  if (maxPrice !== undefined && maxPrice !== '' && !isNaN(Number(maxPrice))) {
    filtered = filtered.filter(l => l.price <= Number(maxPrice));
  }

  if (q && typeof q === 'string' && q.trim()) {
    const terms = q.toLowerCase().trim().split(/\s+/);
    filtered = filtered.filter(item => {
      const searchTarget = `${item.title} ${item.description} ${item.district} ${item.area} ${item.category}`.toLowerCase();
      return terms.every(term => searchTarget.includes(term));
    });
  }

  // Sorting
  if (sort === 'price_asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else {
    // latest
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (pageNum - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const isAdmin = token ? activeSessions.has(token) : false;
  const requesterUid = (req.query.userUid && typeof req.query.userUid === 'string') ? req.query.userUid : null;

  // Enforce contact privacy on all public listing results
  const sanitizedListings = paginated.map(l => sanitizeListingForPublic(l, requesterUid, isAdmin));

  res.json({
    listings: sanitizedListings,
    total,
    page: pageNum,
    totalPages,
    pageSize
  });
});

// 4. View single listing & increment view count
app.get('/api/listings/:id', (req, res) => {
  const { id } = req.params;
  const { userUid } = req.query;
  const listings = readListings();
  const listingIndex = listings.findIndex(l => l.id === id);

  if (listingIndex === -1) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const listing = listings[listingIndex];
  
  // Public visitors cannot see rejected, paused or sold listings directly unless owner or admin
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const isAdmin = token ? activeSessions.has(token) : false;
  const isOwner = userUid && typeof userUid === 'string' && listing.ownerUid === userUid;

  const isPublic = listing.status === 'active' || listing.status === 'approved';
  const allowArchived = req.query.allowArchived === 'true';

  if (!isPublic && !isAdmin && !isOwner && !allowArchived) {
    return res.status(404).json({ error: 'Listing not available or currently paused/sold' });
  }

  // Increment view count
  listing.views = (listing.views || 0) + 1;
  saveListings(listings);

  // Enforce privacy: never return concealed phone to unauthorized public callers
  const sanitized = sanitizeListingForPublic(listing, userUid as string, isAdmin);
  res.json(sanitized);
});

// 5. Get user's own listings (My Ads)
app.get('/api/user/listings', (req, res) => {
  const { ownerUid } = req.query;
  if (!ownerUid || typeof ownerUid !== 'string') {
    return res.status(400).json({ error: 'ownerUid query parameter is required' });
  }

  const listings = readListings();
  const userListings = listings.filter(l => l.ownerUid === ownerUid);
  // Sort newest first
  userListings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ listings: userListings });
});

// 6. Post a new Ad (Published automatically as active)
app.post('/api/listings', (req, res) => {
  try {
    const {
      title,
      category,
      subcategory,
      price,
      isNegotiable,
      condition,
      description,
      district,
      area,
      sellerName,
      sellerPhone,
      showPhone = true,
      allowCalls = true,
      images = [],
      primaryImageIndex = 0,
      ownerUid,
      ownerEmail,
      ownerName
    } = req.body;

    // Strict validation
    if (ownerUid && isUserRestricted(ownerUid)) {
      return res.status(403).json({ error: 'This account has been restricted by safety moderation and cannot post advertisements.' });
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title is required (minimum 3 characters)' });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'A valid price in Taka (৳) is required' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description is required (minimum 10 characters)' });
    }
    if (!district || typeof district !== 'string' || !area || typeof area !== 'string') {
      return res.status(400).json({ error: 'District and area are required' });
    }
    if (!sellerName || typeof sellerName !== 'string' || sellerName.trim().length < 2) {
      return res.status(400).json({ error: 'Seller name is required' });
    }
    if (!sellerPhone || typeof sellerPhone !== 'string' || !/^(?:\+?880|0)1[3-9]\d{8}$/.test(sellerPhone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ error: 'Please enter a valid Bangladesh mobile number (e.g. 01712345678)' });
    }

    // Process and save images (max 5)
    const processedImages: string[] = [];
    const rawImages = Array.isArray(images) ? images.slice(0, 5) : [];
    const newId = `isf-${Date.now()}`;

    for (let i = 0; i < rawImages.length; i++) {
      const img = rawImages[i];
      if (typeof img === 'string') {
        if (img.startsWith('data:image/')) {
          // Parse base64 and save to disk
          const matches = img.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (matches) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const filename = `${newId}_${i}.${ext}`;
            const filepath = path.join(UPLOADS_DIR, filename);
            fs.writeFileSync(filepath, buffer);
            processedImages.push(`/uploads/${filename}`);
          } else {
            processedImages.push(img);
          }
        } else if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/uploads/')) {
          processedImages.push(img);
        }
      }
    }

    const initialHistoryEntry: StatusHistoryEntry = {
      status: 'active',
      changedAt: new Date().toISOString(),
      changedBy: ownerUid || 'seller',
      note: 'Listing published automatically'
    };

    const newListing: Listing = {
      id: newId,
      title: title.trim(),
      category: category.trim(),
      subcategory: subcategory ? String(subcategory).trim() : undefined,
      price: Math.round(Number(price)),
      isNegotiable: Boolean(isNegotiable),
      condition: condition || 'Used',
      description: description.trim(),
      district: district.trim(),
      area: area.trim(),
      sellerName: sellerName.trim(),
      sellerPhone: sellerPhone.trim().replace(/[\s-]/g, ''),
      showPhone: Boolean(showPhone),
      allowCalls: Boolean(allowCalls),
      images: processedImages,
      primaryImageIndex: Math.max(0, Math.min(Number(primaryImageIndex) || 0, Math.max(0, processedImages.length - 1))),
      status: 'active', // Published automatically
      views: 0,
      createdAt: new Date().toISOString(),
      ownerUid: ownerUid || undefined,
      ownerEmail: ownerEmail || undefined,
      ownerName: ownerName || sellerName.trim(),
      statusHistory: [initialHistoryEntry],
      chatMessages: []
    };

    const listings = readListings();
    listings.unshift(newListing);
    saveListings(listings);

    res.status(201).json({
      success: true,
      listingId: newId,
      status: 'active',
      message: 'Your ad has been published live successfully!'
    });
  } catch (err: any) {
    console.error('Error creating listing:', err);
    res.status(500).json({ error: 'Failed to submit listing. Please try again.' });
  }
});

// 7. Update Listing Status (Mark as Sold, Available Again, Pause, Reactivate)
app.patch('/api/listings/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, userUid, note } = req.body;

    if (!status || !['active', 'sold', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (active, sold, paused) is required' });
    }

    const listings = readListings();
    const listing = listings.find(l => l.id === id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const isAdmin = token ? activeSessions.has(token) : false;

    // Check ownership: must be the owner or admin
    if (listing.ownerUid !== userUid && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized: You can only modify your own listings' });
    }

    const previousStatus = listing.status;
    listing.status = status;
    listing.updatedAt = new Date().toISOString();

    if (!listing.statusHistory) {
      listing.statusHistory = [];
    }

    listing.statusHistory.unshift({
      status,
      changedAt: new Date().toISOString(),
      changedBy: userUid || (isAdmin ? 'admin' : 'owner'),
      note: note || `Status changed from ${previousStatus} to ${status}`
    });

    saveListings(listings);

    res.json({ success: true, listing });
  } catch (err: any) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// 8. Edit Ad (Owner or Admin only)
app.put('/api/listings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      subcategory,
      price,
      isNegotiable,
      condition,
      description,
      district,
      area,
      sellerName,
      sellerPhone,
      showPhone,
      allowCalls,
      images,
      primaryImageIndex,
      userUid
    } = req.body;

    const listings = readListings();
    const listing = listings.find(l => l.id === id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const isAdmin = token ? activeSessions.has(token) : false;

    if (listing.ownerUid !== userUid && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized: You can only edit your own listings' });
    }

    // Process new images if base64 provided (max 5)
    if (Array.isArray(images)) {
      const processedImages: string[] = [];
      for (let i = 0; i < images.length && i < 5; i++) {
        const img = images[i];
        if (typeof img === 'string') {
          if (img.startsWith('data:image/')) {
            const matches = img.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches) {
              const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const buffer = Buffer.from(matches[2], 'base64');
              const filename = `${listing.id}_${Date.now()}_${i}.${ext}`;
              const filepath = path.join(UPLOADS_DIR, filename);
              fs.writeFileSync(filepath, buffer);
              processedImages.push(`/uploads/${filename}`);
            } else {
              processedImages.push(img);
            }
          } else {
            processedImages.push(img);
          }
        }
      }
      if (processedImages.length > 0) {
        listing.images = processedImages;
      }
    }

    if (title && title.trim()) listing.title = title.trim();
    if (category) listing.category = category.trim();
    if (subcategory !== undefined) listing.subcategory = subcategory ? String(subcategory).trim() : undefined;
    if (price !== undefined && !isNaN(Number(price))) listing.price = Math.round(Number(price));
    if (isNegotiable !== undefined) listing.isNegotiable = Boolean(isNegotiable);
    if (condition) listing.condition = condition;
    if (description && description.trim()) listing.description = description.trim();
    if (district) listing.district = district.trim();
    if (area) listing.area = area.trim();
    if (sellerName) listing.sellerName = sellerName.trim();
    if (sellerPhone) listing.sellerPhone = sellerPhone.trim().replace(/[\s-]/g, '');
    if (showPhone !== undefined) listing.showPhone = Boolean(showPhone);
    if (allowCalls !== undefined) listing.allowCalls = Boolean(allowCalls);
    if (primaryImageIndex !== undefined) listing.primaryImageIndex = Number(primaryImageIndex) || 0;

    listing.updatedAt = new Date().toISOString();

    if (!listing.statusHistory) {
      listing.statusHistory = [];
    }
    listing.statusHistory.unshift({
      status: listing.status,
      changedAt: new Date().toISOString(),
      changedBy: userUid || (isAdmin ? 'admin' : 'owner'),
      note: 'Listing details updated'
    });

    saveListings(listings);

    res.json({ success: true, listing });
  } catch (err: any) {
    console.error('Error updating listing:', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// 9. In-app Chat / Inquiry on a listing
app.post('/api/listings/:id/chat', (req, res) => {
  try {
    const { id } = req.params;
    const { senderUid, senderName, message } = req.body;

    if (!senderUid || !message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message and sender ID are required' });
    }

    const listings = readListings();
    const listing = listings.find(l => l.id === id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (!listing.chatMessages) {
      listing.chatMessages = [];
    }

    const chatMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderUid,
      senderName: (senderName && typeof senderName === 'string') ? senderName.trim() : 'Interested Buyer',
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    listing.chatMessages.push(chatMsg);
    saveListings(listings);

    res.status(201).json({ success: true, message: chatMsg, allMessages: listing.chatMessages });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/listings/:id/chat', (req, res) => {
  const { id } = req.params;
  const listings = readListings();
  const listing = listings.find(l => l.id === id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  res.json({ messages: listing.chatMessages || [] });
});

// 10. Report a listing
app.post('/api/listings/:id/report', (req, res) => {
  try {
    const { id } = req.params;
    const { reason, details, reporterUid } = req.body;

    if (!reporterUid || typeof reporterUid !== 'string' || !reporterUid.trim()) {
      return res.status(401).json({ error: 'Authentication required. Please log in to submit a report.' });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ error: 'Report reason is required' });
    }

    const reports = readReports();
    // Prevent duplicate spam reports from the same user for the same listing
    const existing = reports.find(
      r => r.listingId === id && r.reporterUid === reporterUid && r.status !== 'dismissed'
    );

    if (existing) {
      return res.status(409).json({
        error: 'You have already reported this listing. Our moderation team is reviewing it.'
      });
    }

    const listings = readListings();
    const listing = listings.find(l => l.id === id);

    const newReport: ListingReport = {
      id: `rep-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type: 'listing',
      listingId: id,
      listingTitle: listing?.title || 'Listing',
      sellerUid: listing?.ownerUid || undefined,
      reporterUid: reporterUid.trim(),
      reason: reason.trim(),
      details: details ? String(details).trim() : '',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    reports.unshift(newReport);
    saveReports(reports);

    res.json({
      success: true,
      message: 'Report submitted successfully. Our safety moderation team will review this listing.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// User Block Management (Phase 5)
app.get('/api/users/:uid/blocked', (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: 'User UID required' });
    const allBlocks = readBlockedUsers();
    res.json({ blockedUsers: allBlocks[uid] || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve blocked users' });
  }
});

app.post('/api/users/:uid/block', (req, res) => {
  try {
    const { uid } = req.params;
    const { targetUid, targetName } = req.body;

    if (!uid || !targetUid) {
      return res.status(400).json({ error: 'User UID and target UID are required' });
    }

    if (uid === targetUid) {
      return res.status(400).json({ error: 'You cannot block your own account' });
    }

    const allBlocks = readBlockedUsers();
    const userList = allBlocks[uid] || [];

    if (!userList.some(b => b.blockedUid === targetUid)) {
      userList.unshift({
        blockedUid: targetUid,
        blockedName: targetName || 'User',
        blockedAt: new Date().toISOString()
      });
      allBlocks[uid] = userList;
      saveBlockedUsers(allBlocks);
    }

    // Mirror block to active conversations between these two participants
    const conversations = readConversations();
    let updatedConvs = false;
    conversations.forEach(c => {
      if (Array.isArray(c.participants) && c.participants.includes(uid) && c.participants.includes(targetUid)) {
        if (!Array.isArray(c.blockedBy)) c.blockedBy = [];
        if (!c.blockedBy.includes(uid)) {
          c.blockedBy.push(uid);
          c.updatedAt = new Date().toISOString();
          updatedConvs = true;
        }
      }
    });
    if (updatedConvs) saveConversations(conversations);

    res.json({ success: true, message: 'User blocked successfully', blockedUsers: allBlocks[uid] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block user' });
  }
});

app.post('/api/users/:uid/unblock', (req, res) => {
  try {
    const { uid } = req.params;
    const { targetUid } = req.body;

    if (!uid || !targetUid) {
      return res.status(400).json({ error: 'User UID and target UID are required' });
    }

    const allBlocks = readBlockedUsers();
    const currentList = allBlocks[uid] || [];
    allBlocks[uid] = currentList.filter(b => b.blockedUid !== targetUid);
    saveBlockedUsers(allBlocks);

    // Unblock in active conversations if blocked by this user
    const conversations = readConversations();
    let updatedConvs = false;
    conversations.forEach(c => {
      if (Array.isArray(c.participants) && c.participants.includes(uid) && c.participants.includes(targetUid)) {
        if (Array.isArray(c.blockedBy) && c.blockedBy.includes(uid)) {
          c.blockedBy = c.blockedBy.filter((id: string) => id !== uid);
          c.updatedAt = new Date().toISOString();
          updatedConvs = true;
        }
      }
    });
    if (updatedConvs) saveConversations(conversations);

    res.json({ success: true, message: 'User unblocked successfully', blockedUsers: allBlocks[uid] || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

app.get('/api/admin/reports', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required' });
  }

  const REPORTS_FILE = path.resolve(DATA_DIR, 'reports.json');
  let reports: ListingReport[] = [];
  if (fs.existsSync(REPORTS_FILE)) {
    try {
      reports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
    } catch {}
  }
  res.json({ reports });
});

// --- USER SAVED / FAVORITE LISTINGS ROUTES (Phase 4) ---

function readFavorites(): Record<string, string[]> {
  if (!fs.existsSync(USER_FAVORITES_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(USER_FAVORITES_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveFavorites(data: Record<string, string[]>): void {
  fs.writeFileSync(USER_FAVORITES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Get favorites for a specific user
app.get('/api/users/:uid/favorites', (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ error: 'User UID required' });
    }
    const allFavs = readFavorites();
    const userFavIds = allFavs[uid] || [];
    const listings = readListings();
    
    // Find all saved listings for user, gracefully preserving status (sold, paused, removed_by_admin)
    const favListings = userFavIds.map(id => {
      const found = listings.find(l => l.id === id);
      if (found) {
        return sanitizeListingForPublic(found, uid, false);
      }
      return null;
    }).filter(Boolean);

    res.json({ favorites: userFavIds, listings: favListings });
  } catch (err) {
    console.error('Failed to get favorites:', err);
    res.status(500).json({ error: 'Failed to retrieve favorites' });
  }
});

// Toggle a favorite listing for a user
app.post('/api/users/:uid/favorites/toggle', (req, res) => {
  try {
    const { uid } = req.params;
    const { listingId } = req.body;
    if (!uid || !listingId) {
      return res.status(400).json({ error: 'User UID and listing ID required' });
    }

    const allFavs = readFavorites();
    const userFavs = allFavs[uid] || [];
    let updated: string[];
    let added = false;

    if (userFavs.includes(listingId)) {
      updated = userFavs.filter(id => id !== listingId);
    } else {
      updated = [listingId, ...userFavs];
      added = true;
    }

    allFavs[uid] = updated;
    saveFavorites(allFavs);

    const listings = readListings();
    const favListings = updated.map(id => {
      const found = listings.find(l => l.id === id);
      return found ? sanitizeListingForPublic(found, uid, false) : null;
    }).filter(Boolean);

    res.json({ success: true, added, favorites: updated, listings: favListings });
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Sync or set all favorites for a user
app.post('/api/users/:uid/favorites', (req, res) => {
  try {
    const { uid } = req.params;
    const { favorites } = req.body;
    if (!uid || !Array.isArray(favorites)) {
      return res.status(400).json({ error: 'User UID and favorites array required' });
    }

    const allFavs = readFavorites();
    allFavs[uid] = Array.from(new Set(favorites.filter(id => typeof id === 'string')));
    saveFavorites(allFavs);

    res.json({ success: true, favorites: allFavs[uid] });
  } catch (err) {
    console.error('Failed to sync favorites:', err);
    res.status(500).json({ error: 'Failed to sync favorites' });
  }
});

// --- IN-APP CHAT & MESSAGING ROUTES (Phase 3) ---

function readConversations(): any[] {
  if (!fs.existsSync(CONVERSATIONS_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveConversations(conversations: any[]): void {
  fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2), 'utf-8');
}

function readMessages(): any[] {
  if (!fs.existsSync(MESSAGES_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveMessages(messages: any[]): void {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
}

// 1. Get conversations for user
app.get('/api/conversations', (req, res) => {
  const { userUid } = req.query;
  if (!userUid || typeof userUid !== 'string') {
    return res.status(400).json({ error: 'userUid is required' });
  }

  const conversations = readConversations();
  const userConversations = conversations.filter(c =>
    Array.isArray(c.participants) && c.participants.includes(userUid)
  );

  userConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json({ conversations: userConversations });
});

// 2. Start or get conversation for a listing
app.post('/api/conversations', (req, res) => {
  try {
    const {
      listingId,
      listingTitle,
      listingPrice,
      listingImage,
      listingDistrict,
      listingArea,
      sellerUid,
      sellerName,
      buyerUid,
      buyerName,
      id
    } = req.body;

    if (!listingId || !buyerUid || !sellerUid) {
      return res.status(400).json({ error: 'listingId, buyerUid, and sellerUid are required' });
    }

    if (buyerUid === sellerUid) {
      return res.status(400).json({ error: 'You cannot start a conversation on your own listing' });
    }

    // Enforce user block restrictions in both directions (Phase 5)
    if (isUserBlockedBidirectional(buyerUid, sellerUid)) {
      return res.status(403).json({ error: 'Cannot start conversation: A block exists between these accounts.' });
    }

    // Enforce restricted accounts
    if (isUserRestricted(buyerUid)) {
      return res.status(403).json({ error: 'Your account is restricted by safety moderation and cannot start conversations.' });
    }

    const conversations = readConversations();
    const convId = id || `conv_${listingId}_${buyerUid}`;

    let conv = conversations.find(c => c.id === convId);
    if (!conv) {
      conv = {
        id: convId,
        listingId,
        listingTitle: listingTitle || 'Listing',
        listingPrice: Number(listingPrice) || 0,
        listingImage: listingImage || '',
        listingDistrict: listingDistrict || '',
        listingArea: listingArea || '',
        sellerUid,
        sellerName: sellerName || 'Seller',
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
      conversations.unshift(conv);
      saveConversations(conversations);
    }

    res.json({ conversation: conv });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// 3. Get messages for a conversation
app.get('/api/conversations/:id/messages', (req, res) => {
  const { id } = req.params;
  const { userUid } = req.query;

  const conversations = readConversations();
  const conv = conversations.find(c => c.id === id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Validate participation if userUid provided
  if (userUid && typeof userUid === 'string' && !conv.participants.includes(userUid)) {
    return res.status(403).json({ error: 'Unauthorized to view this conversation' });
  }

  const allMessages = readMessages();
  const convMessages = allMessages.filter(m => m.conversationId === id);
  convMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({ messages: convMessages });
});

// 4. Send message in conversation
app.post('/api/conversations/:id/messages', (req, res) => {
  try {
    const { id } = req.params;
    const { senderUid, senderName, recipientUid, text } = req.body;

    if (!senderUid || !text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Sender UID and non-empty message are required' });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({ error: 'Message exceeds maximum 1000 characters limit' });
    }

    const conversations = readConversations();
    const convIndex = conversations.findIndex(c => c.id === id);

    if (convIndex === -1) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conv = conversations[convIndex];

    // Check participants
    if (!conv.participants.includes(senderUid)) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    // Check blocked status
    if (Array.isArray(conv.blockedBy) && conv.blockedBy.length > 0) {
      return res.status(403).json({ error: 'This conversation is currently blocked' });
    }

    const targetRecipient = recipientUid || conv.participants.find((p: string) => p !== senderUid) || '';

    // Enforce bidirectional block check between participants (Phase 5)
    if (isUserBlockedBidirectional(senderUid, targetRecipient)) {
      return res.status(403).json({ error: 'Message could not be sent: A block exists between these accounts.' });
    }

    // Enforce restricted accounts
    if (isUserRestricted(senderUid)) {
      return res.status(403).json({ error: 'Your account has been restricted by safety moderation and cannot send messages.' });
    }

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      conversationId: id,
      senderUid,
      senderName: senderName || 'User',
      recipientUid: targetRecipient,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false
    };

    const allMessages = readMessages();
    allMessages.push(newMsg);
    saveMessages(allMessages);

    // Update conversation
    conv.lastMessage = text.trim();
    conv.lastMessageAt = newMsg.createdAt;
    conv.lastSenderUid = senderUid;
    conv.updatedAt = newMsg.createdAt;

    if (!conv.unreadCount) {
      conv.unreadCount = {};
    }
    conv.unreadCount[targetRecipient] = (conv.unreadCount[targetRecipient] || 0) + 1;

    conversations[convIndex] = conv;
    saveConversations(conversations);

    res.status(201).json({ success: true, message: newMsg });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 5. Mark conversation as read
app.post('/api/conversations/:id/read', (req, res) => {
  const { id } = req.params;
  const { userUid } = req.body;

  if (!userUid) {
    return res.status(400).json({ error: 'userUid is required' });
  }

  const conversations = readConversations();
  const conv = conversations.find(c => c.id === id);

  if (conv) {
    if (!conv.unreadCount) conv.unreadCount = {};
    conv.unreadCount[userUid] = 0;
    saveConversations(conversations);
  }

  res.json({ success: true });
});

// 6. Block or unblock conversation participant
app.post('/api/conversations/:id/block', (req, res) => {
  const { id } = req.params;
  const { blockerUid, action } = req.body; // action: 'block' | 'unblock'

  if (!blockerUid) {
    return res.status(400).json({ error: 'blockerUid is required' });
  }

  const conversations = readConversations();
  const conv = conversations.find(c => c.id === id);

  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  if (!Array.isArray(conv.blockedBy)) {
    conv.blockedBy = [];
  }

  if (action === 'unblock') {
    conv.blockedBy = conv.blockedBy.filter((uid: string) => uid !== blockerUid);
  } else {
    if (!conv.blockedBy.includes(blockerUid)) {
      conv.blockedBy.push(blockerUid);
    }
  }

  conv.updatedAt = new Date().toISOString();
  saveConversations(conversations);

  res.json({ success: true, blockedBy: conv.blockedBy });
});

// 7. General abuse and safety report
app.post('/api/reports', (req, res) => {
  try {
    const { conversationId, messageId, reporterUid, reportedUid, reason, details } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ error: 'Report reason is required' });
    }

    const REPORTS_FILE = path.resolve(DATA_DIR, 'reports.json');
    let reports: any[] = [];
    if (fs.existsSync(REPORTS_FILE)) {
      try {
        reports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
      } catch {}
    }

    const newReport = {
      id: `chat-rep-${Date.now()}`,
      conversationId,
      messageId,
      reporterUid,
      reportedUid,
      reason: reason.trim(),
      details: details ? String(details).trim() : '',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    reports.unshift(newReport);
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'Report submitted. Our moderation team will investigate this user activity.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// --- ADMIN API ROUTES ---

// 6. Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (!ADMIN_SECRET) {
    return res.status(503).json({ error: 'Admin authorization is not configured in server environment (ADMIN_PASSWORD is missing)' });
  }

  // Check password against environment secret
  if (password.trim() === ADMIN_SECRET) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions.add(sessionToken);
    return res.json({
      success: true,
      token: sessionToken,
      message: 'Admin authentication successful'
    });
  }

  res.status(401).json({ error: 'Incorrect administrator password' });
});

// 7. Verify Admin Session
app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ authenticated: true, role: 'admin' });
});

// 8. Admin Logout
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// 9. Admin Stats Overview
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const listings = readListings();
  const reports = readReports();
  const pending = listings.filter(l => l.status === 'pending').length;
  const approved = listings.filter(l => l.status === 'approved' || l.status === 'active').length;
  const rejected = listings.filter(l => l.status === 'rejected' || l.status === 'removed_by_admin').length;
  const totalViews = listings.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  res.json({
    total: listings.length,
    pending,
    approved,
    rejected,
    totalViews,
    totalReports: reports.length,
    pendingReports
  });
});

// 10. Admin List Listings (all statuses)
app.get('/api/admin/listings', requireAdmin, (req, res) => {
  const { status } = req.query;
  const listings = readListings();

  let filtered = [...listings];
  if (status && status !== 'all') {
    filtered = filtered.filter(l => l.status === status);
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(filtered);
});

// 11. Admin Reports Management (Separated into Listings, Users, Conversations)
app.get('/api/admin/reports', requireAdmin, (req, res) => {
  const reports = readReports();
  const listings = readListings();

  // Enrich reports with listing info if available
  const enrichedReports = reports.map(rep => {
    if (rep.listingId) {
      const listing = listings.find(l => l.id === rep.listingId);
      return {
        ...rep,
        listingDetails: listing ? sanitizeListingForPublic(listing, null, true) : null
      };
    }
    return rep;
  });

  const listingReports = enrichedReports.filter(r => !r.type || r.type === 'listing');
  const userReports = enrichedReports.filter(r => r.type === 'user');
  const chatReports = enrichedReports.filter(r => r.type === 'chat');

  res.json({
    reports: enrichedReports,
    listingReports,
    userReports,
    chatReports,
    pendingCount: reports.filter(r => r.status === 'pending').length
  });
});

// 12. Admin Take Action on a Report
app.post('/api/admin/reports/:id/action', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { action, reason = 'Moderation review decision', details } = req.body;

  const reports = readReports();
  const reportIndex = reports.findIndex(r => r.id === id);

  if (reportIndex === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const report = reports[reportIndex];
  const now = new Date().toISOString();

  if (action === 'dismiss') {
    report.status = 'dismissed';
    report.actionTaken = 'Report dismissed after review';
    report.resolvedAt = now;
    report.resolvedBy = 'admin';

    recordAuditLog({
      adminUid: 'admin-super',
      action: 'dismiss_report',
      targetId: id,
      targetType: 'report',
      reason,
      details: details || `Dismissed report reason: ${report.reason}`
    });
  } else if (action === 'remove_listing') {
    // Remove listing from public visibility
    if (report.listingId) {
      const listings = readListings();
      const listing = listings.find(l => l.id === report.listingId);
      if (listing) {
        listing.status = 'removed_by_admin';
        listing.rejectionReason = reason;
        if (!listing.statusHistory) listing.statusHistory = [];
        listing.statusHistory.unshift({
          status: 'removed_by_admin',
          changedAt: now,
          changedBy: 'admin',
          note: `Removed by moderation: ${reason}`
        });
        saveListings(listings);
      }
    }

    report.status = 'resolved';
    report.actionTaken = `Listing removed: ${reason}`;
    report.resolvedAt = now;
    report.resolvedBy = 'admin';

    recordAuditLog({
      adminUid: 'admin-super',
      action: 'remove_listing',
      targetId: report.listingId || id,
      targetType: 'listing',
      reason,
      details: `Triggered by report ${id}`
    });
  } else if (action === 'suspend_listing') {
    if (report.listingId) {
      const listings = readListings();
      const listing = listings.find(l => l.id === report.listingId);
      if (listing) {
        listing.status = 'paused';
        if (!listing.statusHistory) listing.statusHistory = [];
        listing.statusHistory.unshift({
          status: 'paused',
          changedAt: now,
          changedBy: 'admin',
          note: `Suspended by moderation: ${reason}`
        });
        saveListings(listings);
      }
    }

    report.status = 'resolved';
    report.actionTaken = `Listing paused/suspended: ${reason}`;
    report.resolvedAt = now;
    report.resolvedBy = 'admin';

    recordAuditLog({
      adminUid: 'admin-super',
      action: 'suspend_listing',
      targetId: report.listingId || id,
      targetType: 'listing',
      reason
    });
  } else if (action === 'restrict_user') {
    const targetUid = report.reportedUid || report.sellerUid;
    if (targetUid) {
      const restricted = readRestrictedUsers();
      if (!restricted.includes(targetUid)) {
        restricted.push(targetUid);
        saveRestrictedUsers(restricted);
      }
    }

    report.status = 'resolved';
    report.actionTaken = `Account restricted: ${reason}`;
    report.resolvedAt = now;
    report.resolvedBy = 'admin';

    recordAuditLog({
      adminUid: 'admin-super',
      action: 'restrict_user',
      targetId: targetUid || id,
      targetType: 'user',
      reason
    });
  }

  reports[reportIndex] = report;
  saveReports(reports);

  res.json({ success: true, report, message: 'Moderation action applied and recorded in audit log' });
});

// 13. Admin Suspend / Remove Listing
app.post('/api/admin/listings/:id/suspend', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { reason = 'Suspended by admin moderation', status = 'removed_by_admin' } = req.body;
  const listings = readListings();
  const listing = listings.find(l => l.id === id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const now = new Date().toISOString();
  listing.status = (status === 'paused' ? 'paused' : 'removed_by_admin') as ListingStatus;
  listing.rejectionReason = reason;
  if (!listing.statusHistory) listing.statusHistory = [];
  listing.statusHistory.unshift({
    status: listing.status,
    changedAt: now,
    changedBy: 'admin',
    note: reason
  });
  saveListings(listings);

  recordAuditLog({
    adminUid: 'admin-super',
    action: status === 'paused' ? 'suspend_listing' : 'remove_listing',
    targetId: id,
    targetType: 'listing',
    reason
  });

  res.json({ success: true, listing });
});

// 14. Admin Restore Listing to Active
app.post('/api/admin/listings/:id/restore', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { note = 'Restored to active by moderator' } = req.body;
  const listings = readListings();
  const listing = listings.find(l => l.id === id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const now = new Date().toISOString();
  listing.status = 'active';
  delete listing.rejectionReason;
  if (!listing.statusHistory) listing.statusHistory = [];
  listing.statusHistory.unshift({
    status: 'active',
    changedAt: now,
    changedBy: 'admin',
    note
  });
  saveListings(listings);

  recordAuditLog({
    adminUid: 'admin-super',
    action: 'restore_listing',
    targetId: id,
    targetType: 'listing',
    reason: note
  });

  res.json({ success: true, listing });
});

// 15. Admin Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  const logs = readAuditLogs();
  res.json({ logs });
});

// 16. Admin Restricted Accounts
app.get('/api/admin/restricted-users', requireAdmin, (req, res) => {
  const restrictedUsers = readRestrictedUsers();
  res.json({ restrictedUsers });
});

app.post('/api/admin/users/:uid/restrict', requireAdmin, (req, res) => {
  const { uid } = req.params;
  const { reason = 'Account restricted by administrator' } = req.body;

  const restricted = readRestrictedUsers();
  if (!restricted.includes(uid)) {
    restricted.push(uid);
    saveRestrictedUsers(restricted);
  }

  recordAuditLog({
    adminUid: 'admin-super',
    action: 'restrict_user',
    targetId: uid,
    targetType: 'user',
    reason
  });

  res.json({ success: true, restrictedUsers: restricted });
});

app.post('/api/admin/users/:uid/unrestrict', requireAdmin, (req, res) => {
  const { uid } = req.params;
  let restricted = readRestrictedUsers();
  restricted = restricted.filter(u => u !== uid);
  saveRestrictedUsers(restricted);

  recordAuditLog({
    adminUid: 'admin-super',
    action: 'unrestrict_user',
    targetId: uid,
    targetType: 'user',
    reason: 'Account restriction lifted by administrator'
  });

  res.json({ success: true, restrictedUsers: restricted });
});

// 17. Admin Delete Listing (Admin only)
app.delete('/api/admin/listings/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  let listings = readListings();
  const existing = listings.find(l => l.id === id);

  if (!existing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  // Remove associated upload files if any
  if (existing.images && Array.isArray(existing.images)) {
    for (const imgUrl of existing.images) {
      if (imgUrl.startsWith('/uploads/')) {
        const filePath = path.join(UPLOADS_DIR, path.basename(imgUrl));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error('Failed to remove image file:', filePath, e);
          }
        }
      }
    }
  }

  listings = listings.filter(l => l.id !== id);
  saveListings(listings);

  recordAuditLog({
    adminUid: 'admin-super',
    action: 'permanent_delete',
    targetId: id,
    targetType: 'listing',
    reason: 'Permanently deleted by administrator'
  });

  res.json({ success: true, message: 'Listing permanently removed' });
});

// --- VITE DEV / PRODUCTION INTEGRATION ---

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ISFADUR] Server active on port ${PORT} (${isProduction ? 'Production' : 'Development'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
