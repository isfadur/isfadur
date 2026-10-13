import React, { useState, useEffect } from 'react';
import { Listing } from '../types';
import { CATEGORIES_LIST } from '../data/categories';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import { compressAndResizeImage } from '../utils/imageCompressor';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Upload,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Save,
  Star,
  Eye,
  EyeOff,
  Phone,
  PhoneOff
} from 'lucide-react';

interface EditAdModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang?: 'en' | 'bn';
}

interface ImageUploadItem {
  dataUrl: string;
  fileName: string;
  isExisting: boolean;
}

export const EditAdModal: React.FC<EditAdModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSuccess,
  lang = 'en',
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES_LIST[0].name);
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [condition, setCondition] = useState<'Brand New' | 'Used' | 'Like New' | 'Not Applicable'>('Used');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState(BANGLADESH_DISTRICTS[0].name);
  const [area, setArea] = useState(BANGLADESH_DISTRICTS[0].areas[0]);
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [showPhone, setShowPhone] = useState(true);
  const [allowCalls, setAllowCalls] = useState(true);
  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setCategory(listing.category);
      setSubcategory(listing.subcategory || '');
      setPrice(listing.price.toString());
      setIsNegotiable(Boolean(listing.isNegotiable));
      setCondition(listing.condition || 'Used');
      setDescription(listing.description);
      setDistrict(listing.district);
      setArea(listing.area);
      setSellerName(listing.sellerName);
      setSellerPhone(listing.sellerPhone || '');
      setShowPhone(listing.showPhone !== false);
      setAllowCalls(listing.allowCalls !== false);
      setPrimaryImageIndex(listing.primaryImageIndex || 0);
      setImages(
        (listing.images || []).map((imgUrl) => ({
          dataUrl: imgUrl,
          fileName: 'Uploaded Image',
          isExisting: true,
        }))
      );
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  const currentCategoryObj =
    CATEGORIES_LIST.find((c) => c.name === category) || CATEGORIES_LIST[0];

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
        const result = await compressAndResizeImage(file, 900, 0.78);
        newImages.push({
          dataUrl: result.dataUrl,
          fileName: file.name,
          isExisting: false,
        });
      }
      setImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      setErrorMessage('Failed to compress image.');
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

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage(lang === 'bn' ? 'বিজ্ঞাপনের শিরোনাম দিন (কমপক্ষে ৩ অক্ষর)।' : 'Please provide a title (at least 3 characters).');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage(lang === 'bn' ? 'সঠিক মূল্য উল্লেখ করুন।' : 'Please enter a valid price in BDT.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage(lang === 'bn' ? 'বিস্তারিত বিবরণ দিন (কমপক্ষে ১০ অক্ষর)।' : 'Please enter a description (at least 10 characters).');
      return;
    }

    const cleanPhone = sellerPhone.replace(/[\s-]/g, '');
    if (showPhone && !/^(?:\+?880|0)1[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMessage(lang === 'bn' ? 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।' : 'Please enter a valid 11-digit Bangladeshi mobile number.');
      return;
    }

    // Reorder images to put selected primary image first
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
        sellerPhone: cleanPhone || listing.sellerPhone,
        showPhone,
        allowCalls: showPhone && allowCalls,
        images: orderedImages.map((img) => img.dataUrl),
        primaryImageIndex: 0,
        userUid: user?.uid,
      };

      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update listing');
      }

      setSuccessMessage(lang === 'bn' ? 'বিজ্ঞাপন সফলভাবে আপডেট করা হয়েছে!' : 'Listing updated successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while updating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
          <div>
            <h2 className="text-base font-bold leading-tight">
              {lang === 'bn' ? 'বিজ্ঞাপন সম্পাদনা করুন' : 'Edit Advertisement'}
            </h2>
            <p className="text-xs text-slate-400">
              ID: {listing.id} • {listing.district}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'bn' ? 'বিজ্ঞাপনের শিরোনাম' : 'Listing Title'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'} <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES_LIST.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'সাব-ক্যাটাগরি' : 'Subcategory'}
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {currentCategoryObj.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'bn' ? 'অবস্থা (Condition)' : 'Condition'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Used', 'Brand New', 'Like New'].map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setCondition(cond as any)}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    condition === cond
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Negotiable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'মূল্য (টাকা ৳)' : 'Price (৳ BDT)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="editNegotiable"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="editNegotiable" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                {lang === 'bn' ? 'দাম আলোচনা সাপেক্ষ (Negotiable)' : 'Price is Negotiable'}
              </label>
            </div>
          </div>

          {/* District & Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'জেলা' : 'District'} <span className="text-red-500">*</span>
              </label>
              <select
                value={district}
                onChange={handleDistrictChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'এলাকা / থানা' : 'Area / Thana'} <span className="text-red-500">*</span>
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {currentDistrictObj.areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Details & Privacy */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিক্রেতার নাম' : 'Seller Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
                </label>
                <input
                  type="text"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Privacy Toggles */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => {
                    setShowPhone(e.target.checked);
                    if (!e.target.checked) setAllowCalls(false);
                  }}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  {showPhone ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  {lang === 'bn' ? 'বিজ্ঞাপনে ফোন নম্বর দৃশ্যমান রাখুন' : 'Show phone number publicly'}
                </span>
              </label>

              {showPhone && (
                <label className="flex items-center gap-2 cursor-pointer ml-6">
                  <input
                    type="checkbox"
                    checked={allowCalls}
                    onChange={(e) => setAllowCalls(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                    {allowCalls ? <Phone className="w-3.5 h-3.5 text-emerald-600" /> : <PhoneOff className="w-3.5 h-3.5 text-slate-400" />}
                    {lang === 'bn' ? 'সরাসরি ফোন কল করার অনুমতি দিন' : 'Allow direct phone calls'}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'bn' ? 'বিজ্ঞাপনের বিবরণ' : 'Description'} <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Photos Management (Max 5, Choose Main Image) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'বিজ্ঞাপনের ছবি (সর্বোচ্চ ৫টি)' : 'Photos (Max 5)'}
              </label>
              <span className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'কভার ফটো নির্বাচন করতে স্টারে ক্লিক করুন' : 'Click star to set primary cover photo'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {images.map((img, idx) => {
                const isPrimary = primaryImageIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all ${
                      isPrimary
                        ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <img src={img.dataUrl} alt="Thumbnail" className="w-full h-full object-cover" />

                    <button
                      type="button"
                      onClick={() => setPrimaryImageIndex(idx)}
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors ${
                        isPrimary
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900/70 hover:bg-slate-900 text-white'
                      }`}
                      title="Set as Main Cover Photo"
                    >
                      <Star className={`w-3 h-3 ${isPrimary ? 'fill-white' : ''}`} />
                      <span>{isPrimary ? 'Main' : 'Cover'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {images.length < 5 && (
                <label className="aspect-4/3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-slate-800/40 transition-colors">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-[11px] text-slate-500 mt-1">
                    {isCompressing ? 'Compressing...' : 'Add Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple={images.length < 4}
                    disabled={isCompressing}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
