import React, { useState, useEffect } from 'react';
import { CATEGORIES_LIST } from '../data/categories';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import { compressAndResizeImage, formatBytes } from '../utils/imageCompressor';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  PackageCheck,
  Star,
  Phone,
  PhoneOff,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

interface PostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newListingId: string) => void;
  lang?: 'en' | 'bn';
}

interface ImageUploadItem {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  fileName: string;
}

export const PostAdModal: React.FC<PostAdModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang = 'en',
}) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES_LIST[0].name);
  const [subcategory, setSubcategory] = useState(CATEGORIES_LIST[0].subcategories[0] || '');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [condition, setCondition] = useState<'Brand New' | 'Used' | 'Like New' | 'Not Applicable'>('Used');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState(BANGLADESH_DISTRICTS[0].name);
  const [area, setArea] = useState(BANGLADESH_DISTRICTS[0].areas[0]);
  const [sellerName, setSellerName] = useState(profile?.displayName || user?.displayName || '');
  const [sellerPhone, setSellerPhone] = useState('');
  const [showPhone, setShowPhone] = useState(true);
  const [allowCalls, setAllowCalls] = useState(true);

  // Sync seller name if profile changes
  useEffect(() => {
    if (!sellerName && (profile?.displayName || user?.displayName)) {
      setSellerName(profile?.displayName || user?.displayName || '');
    }
  }, [profile, user]);

  // Images state (max 5)
  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Selected category object
  const currentCategoryObj = CATEGORIES_LIST.find((c) => c.name === category) || CATEGORIES_LIST[0];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setCategory(selected);
    const catObj = CATEGORIES_LIST.find((c) => c.name === selected);
    if (catObj && catObj.subcategories.length > 0) {
      setSubcategory(catObj.subcategories[0]);
    } else {
      setSubcategory('');
    }
  };

  // Selected district's available areas
  const currentDistrictObj =
    BANGLADESH_DISTRICTS.find((d) => d.name === district) || BANGLADESH_DISTRICTS[0];

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setDistrict(selected);
    const found = BANGLADESH_DISTRICTS.find((d) => d.name === selected);
    if (found && found.areas.length > 0) {
      setArea(found.areas[0]);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      setErrorMessage(
        lang === 'bn'
          ? 'সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে।'
          : 'You can upload a maximum of 5 images per listing.'
      );
      return;
    }

    setErrorMessage('');
    setIsCompressing(true);

    try {
      const newImages: ImageUploadItem[] = [];
      for (let i = 0; i < files.length; i++) {
        if (images.length + newImages.length >= 5) break;
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setErrorMessage(lang === 'bn' ? 'শুধুমাত্র ছবি ফাইল নির্বাচন করুন।' : 'Please upload valid image files only.');
          continue;
        }

        // Validate max file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          setErrorMessage(lang === 'bn' ? 'ছবি ১০MB এর চেয়ে ছোট হতে হবে।' : 'Each photo must be smaller than 10MB.');
          continue;
        }

        // Compress and downscale on client canvas
        const result = await compressAndResizeImage(file, 900, 0.78);
        newImages.push({
          dataUrl: result.dataUrl,
          originalSize: result.originalSizeBytes,
          compressedSize: result.compressedSizeBytes,
          fileName: file.name,
        });
      }

      setImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      setErrorMessage(lang === 'bn' ? 'ছবি প্রসেস করতে ব্যর্থ হয়েছে।' : 'Failed to compress image. Please try a different photo.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (primaryImageIndex >= updated.length) {
        setPrimaryImageIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Strict validation
    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage(lang === 'bn' ? 'বিজ্ঞাপনের শিরোনাম দিন (কমপক্ষে ৩ অক্ষর)।' : 'Please provide an ad title (at least 3 characters).');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage(lang === 'bn' ? 'সঠিক মূল্য উল্লেখ করুন (টাকা ৳)।' : 'Please enter a valid price in BDT (৳).');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage(lang === 'bn' ? 'বিস্তারিত বিবরণ দিন (কমপক্ষে ১০ অক্ষর)।' : 'Please enter a clear description (at least 10 characters).');
      return;
    }

    if (!sellerName.trim() || sellerName.trim().length < 2) {
      setErrorMessage(lang === 'bn' ? 'আপনার নাম দিন।' : 'Please provide your name.');
      return;
    }

    // Bangladesh mobile number pattern
    const cleanPhone = sellerPhone.replace(/[\s-]/g, '');
    if (!/^(?:\+?880|0)1[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMessage(
        lang === 'bn'
          ? 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।'
          : 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).'
      );
      return;
    }

    // Reorder images so chosen primary image is first
    let orderedImages = [...images];
    if (primaryImageIndex > 0 && primaryImageIndex < orderedImages.length) {
      const primaryItem = orderedImages.splice(primaryImageIndex, 1)[0];
      orderedImages.unshift(primaryItem);
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        category,
        subcategory: subcategory ? subcategory.trim() : undefined,
        price: numPrice,
        isNegotiable,
        condition,
        description: description.trim(),
        district,
        area,
        sellerName: sellerName.trim(),
        sellerPhone: cleanPhone,
        showPhone,
        allowCalls: showPhone && allowCalls,
        images: orderedImages.map((img) => img.dataUrl),
        primaryImageIndex: 0,
        ownerUid: user?.uid,
        ownerEmail: user?.email,
        ownerName: profile?.displayName || user?.displayName || sellerName.trim(),
      };

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit listing');
      }

      setSubmittedId(data.listingId);
      onSuccess(data.listingId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while submitting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
          <div>
            <h2 className="text-base sm:text-lg font-bold leading-tight">
              {lang === 'bn' ? 'বিজ্ঞাপন পোস্ট করুন' : 'Post an Advertisement'}
            </h2>
            <p className="text-xs text-emerald-400 font-medium">
              {lang === 'bn' ? 'সরাসরি লাইভ প্রকাশিত হবে • কোনো ফি নেই' : 'Published Live Instantly • 100% Free'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If successfully submitted: Show Confirmation */}
        {submittedId ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-inner">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'বিজ্ঞাপন সফলভাবে লাইভ হয়েছে!' : 'Ad Published Live Successfully!'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Tracking ID: {submittedId}
              </p>
              <div className="max-w-md mx-auto p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs text-left space-y-2 mt-4">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 dark:text-emerald-100">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'bn' ? 'সরাসরি মার্কেটপ্লেসে লাইভ' : 'Active & Visible in Marketplace'}</span>
                </div>
                <p className="leading-relaxed">
                  {lang === 'bn'
                    ? 'আপনার বিজ্ঞাপনটি সমগ্র বাংলাদেশে লাইভ হয়ে গেছে। ক্রেতারা অবিলম্বে আপনার সাথে ইন-অ্যাপ চ্যাট বা অনুমোদিত ফোনে যোগাযোগ করতে পারবেন।'
                    : 'Your listing is now live across Bangladesh. Buyers can contact you via in-app chat and your preferred phone contact.'}
                </p>
                <p className="leading-relaxed font-semibold">
                  {lang === 'bn'
                    ? 'আপনি যেকোনো সময় "My Ads" সেকশন থেকে বিজ্ঞাপনটি এডিট, স্থগিত বা বিক্রিত মার্ক করতে পারেন।'
                    : 'You can edit, pause, or mark this ad as sold anytime from your "My Ads" dashboard.'}
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'bn' ? 'মার্কেটপ্লেসে ফিরুন' : 'Back to Marketplace'}
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'bn' ? 'বিজ্ঞাপনের শিরোনাম *' : 'Ad Title *'}
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder={
                  lang === 'bn'
                    ? 'যেমন: iPhone 14 Pro 128GB Deep Purple বা Yamaha FZS V3'
                    : 'e.g. iPhone 14 Pro 128GB Deep Purple or Yamaha FZS V3'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {lang === 'bn' ? 'ক্যাটাগরি *' : 'Category *'}
                </label>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES_LIST.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {lang === 'bn' ? 'সাব-ক্যাটাগরি' : 'Subcategory'}
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {currentCategoryObj.subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condition: New or Used */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'bn' ? 'পণ্য বা আইটেমের অবস্থা *' : 'Item Condition *'}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: 'Used', label: lang === 'bn' ? 'Used (ব্যবহৃত)' : 'Used' },
                  { value: 'Brand New', label: lang === 'bn' ? 'New (একদম নতুন)' : 'New / Brand New' },
                  { value: 'Like New', label: lang === 'bn' ? 'Like New (তুচ্ছ ব্যবহৃত)' : 'Like New' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCondition(item.value as any)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      condition === item.value
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Negotiable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {lang === 'bn' ? 'মূল্য (টাকা ৳) *' : 'Price (৳ BDT) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="5000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full text-xs sm:text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center h-11">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'দাম আলোচনা সাপেক্ষে (Negotiable)' : 'Price is Negotiable'}
                  </span>
                </label>
              </div>
            </div>

            {/* District & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {lang === 'bn' ? 'জেলা *' : 'District *'}
                </label>
                <select
                  value={district}
                  onChange={handleDistrictChange}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {lang === 'bn' ? 'এলাকা / থানা *' : 'Area / Thana *'}
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {currentDistrictObj.areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'bn' ? 'বিজ্ঞাপনের বিবরণ *' : 'Description *'}
              </label>
              <textarea
                rows={4}
                required
                maxLength={2000}
                placeholder={
                  lang === 'bn'
                    ? 'পণ্যের স্পেসিফিকেশন, ব্যবহারের সময়কাল, ওয়ারেন্টি ও ডেলিভারি বিবরণ উল্লেখ করুন...'
                    : 'Mention item specifications, condition, warranty, accessories included, and pickup/delivery arrangements...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400">
                {description.length}/2000 {lang === 'bn' ? 'অক্ষর' : 'characters'}
              </span>
            </div>

            {/* Photos upload (Max 5, Choose Main Image) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'bn' ? 'পণ্যের ছবি (সর্বোচ্চ ৫টি)' : 'Product Photos (Max 5)'}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'ছবি স্বয়ংক্রিয়ভাবে কম্প্রেস হবে। যেকোনো ছবিতে ক্লিক করে মূল ছবি (Main Photo) নির্বাচন করুন।'
                      : 'Choose primary cover photo using the star. Photos are optimized automatically.'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {images.length}/5
                </span>
              </div>

              {/* Thumbnails preview */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {images.map((img, index) => {
                  const isPrimary = primaryImageIndex === index;
                  return (
                    <div
                      key={index}
                      className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all ${
                        isPrimary
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <img
                        src={img.dataUrl}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Main Photo Badge / Selector */}
                      <button
                        type="button"
                        onClick={() => setPrimaryImageIndex(index)}
                        className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors ${
                          isPrimary
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900/70 hover:bg-slate-900 text-white'
                        }`}
                        title="Set as Main Cover Photo"
                      >
                        <Star className={`w-3 h-3 ${isPrimary ? 'fill-white' : ''}`} />
                        <span>{isPrimary ? (lang === 'bn' ? 'মূল ছবি' : 'Main') : (lang === 'bn' ? 'কভার করুন' : 'Make Main')}</span>
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-lg transition-colors shadow-xs"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] text-emerald-300 px-1 py-0.5 truncate text-center font-mono">
                        {formatBytes(img.compressedSize)}
                      </div>
                    </div>
                  );
                })}

                {/* Upload Button */}
                {images.length < 5 && (
                  <label className="relative aspect-4/3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500 dark:text-slate-400 hover:text-emerald-600 bg-white dark:bg-slate-800">
                    <input
                      type="file"
                      accept="image/*"
                      multiple={images.length < 4}
                      onChange={handleImageSelect}
                      disabled={isCompressing}
                      className="sr-only"
                    />
                    {isCompressing ? (
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[11px] font-bold">
                          {lang === 'bn' ? '+ ছবি যোগ করুন' : '+ Add Photo'}
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Seller Contact & Privacy Preferences (Phase 2 Requirement) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {lang === 'bn' ? 'যোগাযোগ ও গোপনীয়তা সেটিংস (Privacy Preferences)' : 'Seller Contact & Privacy Preferences'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'আপনার নাম *' : 'Your Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Hasan"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01712345678"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Privacy Toggles: Show/Hide Phone & Allow/Disable Calls */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    {showPhone ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {lang === 'bn' ? 'বিজ্ঞাপনে ফোন নম্বর প্রদর্শন করুন' : 'Show phone number on public listing'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lang === 'bn'
                          ? 'বন্ধ রাখলে নম্বর গোপন থাকবে এবং ক্রেতারা ইন-অ্যাপ চ্যাটে যোগাযোগ করবেন।'
                          : 'If turned off, phone number is hidden and buyers will contact via in-app chat.'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => {
                      setShowPhone(e.target.checked);
                      if (!e.target.checked) setAllowCalls(false);
                      else setAllowCalls(true);
                    }}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 mt-1 focus:ring-emerald-500"
                  />
                </div>

                {showPhone && (
                  <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      {allowCalls ? <Phone className="w-4 h-4 text-emerald-600" /> : <PhoneOff className="w-4 h-4 text-slate-400" />}
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {lang === 'bn' ? 'সরাসরি ফোন কল করার অনুমতি দিন' : 'Allow direct phone calls'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {lang === 'bn'
                            ? 'ক্রেতারা "Call Seller" বাটনে চাপ দিয়ে সরাসরি ফোন দিতে পারবেন।'
                            : 'Buyers can press "Call Seller" to dial your phone number.'}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowCalls}
                      onChange={(e) => setAllowCalls(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 mt-1 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isCompressing}
                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors shadow-xs flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'bn' ? 'পাবলিশ হচ্ছে...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'বিজ্ঞাপন পাবলিশ করুন (লাইভ)' : 'Publish Advertisement (Live)'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
