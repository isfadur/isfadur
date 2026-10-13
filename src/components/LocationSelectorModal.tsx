import React, { useState } from 'react';
import { BANGLADESH_DISTRICTS, DistrictInfo } from '../data/districts';
import { Language, translations } from '../i18n/translations';
import {
  X,
  MapPin,
  Compass,
  Search,
  Check,
  ChevronRight,
  AlertCircle,
  Loader2,
  Globe2
} from 'lucide-react';

// Approximate centroid coordinates for Bangladesh districts
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Dhaka': { lat: 23.8103, lng: 90.4125 },
  'Chattogram': { lat: 22.3569, lng: 91.7832 },
  'Sylhet': { lat: 24.8949, lng: 91.8687 },
  'Rajshahi': { lat: 24.3636, lng: 88.6241 },
  'Khulna': { lat: 22.8456, lng: 89.5403 },
  'Barishal': { lat: 22.7010, lng: 90.3535 },
  'Rangpur': { lat: 25.7439, lng: 89.2752 },
  'Mymensingh': { lat: 24.7471, lng: 90.4203 },
  'Gazipur': { lat: 23.9999, lng: 90.4203 },
  'Narayanganj': { lat: 23.6238, lng: 90.5000 },
  'Cumilla': { lat: 23.4607, lng: 91.1809 },
  'Bogura': { lat: 24.8465, lng: 89.3777 },
  "Cox's Bazar": { lat: 21.4272, lng: 92.0058 },
};

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDistrict: string;
  selectedArea: string;
  onSelectLocation: (district: string, area: string) => void;
  lang?: Language;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedDistrict,
  selectedArea,
  onSelectLocation,
  lang = 'en'
}) => {
  const [activeStep, setActiveStep] = useState<'district' | 'area'>('district');
  const [tempDistrict, setTempDistrict] = useState<string>(selectedDistrict);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectSuccess, setDetectSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = translations[lang];

  // Geolocation detector - One-shot only, never tracking continuously
  const handleDetectLocation = () => {
    setDetectError(null);
    setDetectSuccess(null);

    if (!navigator.geolocation) {
      setDetectError(
        lang === 'bn'
          ? 'আপনার ব্রাউজারে লোকেশন সনাক্তকরণ সমর্থিত নয়। অনুগ্রহ করে নিচের তালিকা থেকে জেলা বেছে নিন।'
          : 'Geolocation is not supported by your browser. Please select your district manually below.'
      );
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsDetecting(false);
        const { latitude, longitude } = pos.coords;

        // Try reverse geocoding via OpenStreetMap with timeout fallback
        let detectedDistrictName: string | null = null;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            const city = address.city || address.state || address.county || address.state_district || '';
            const match = BANGLADESH_DISTRICTS.find(
              (d) => city.toLowerCase().includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(city.toLowerCase())
            );
            if (match) {
              detectedDistrictName = match.name;
            }
          }
        } catch {
          // Fallback to geometric centroid distance below
        }

        // Geometric centroid distance match if reverse lookup did not identify
        if (!detectedDistrictName) {
          let closest = 'Dhaka';
          let minDistance = Infinity;

          for (const [name, coords] of Object.entries(DISTRICT_COORDINATES)) {
            const dist = getDistanceKm(latitude, longitude, coords.lat, coords.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closest = name;
            }
          }
          detectedDistrictName = closest;
        }

        const matchedDistrict = BANGLADESH_DISTRICTS.find((d) => d.name === detectedDistrictName);

        if (matchedDistrict) {
          setDetectSuccess(
            lang === 'bn'
              ? `আপনার অবস্থান সনাক্ত করা হয়েছে: ${matchedDistrict.name}`
              : `Location detected: ${matchedDistrict.name}`
          );
          setTempDistrict(matchedDistrict.name);
          // Let user confirm or select specific area
          setTimeout(() => {
            onSelectLocation(matchedDistrict.name, 'All');
            onClose();
          }, 800);
        }
      },
      (err) => {
        setIsDetecting(false);
        if (err.code === 1) {
          setDetectError(
            lang === 'bn'
              ? 'লোকেশন পারমিশন দেওয়া হয়নি। কোনো সমস্যা নেই, নিচে থেকে জেলা নির্বাচন করুন।'
              : 'Location permission was denied in your browser. You can select your district manually below.'
          );
        } else {
          setDetectError(
            lang === 'bn'
              ? 'লোকেশন নির্ণয় করা যায়নি। অনুগ্রহ করে নিচের তালিকা থেকে জেলা বেছে নিন।'
              : 'Unable to detect your location. Please select your district manually below.'
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  };

  const currentDistrictObj = BANGLADESH_DISTRICTS.find((d) => d.name === tempDistrict);

  // Filter districts by search query
  const filteredDistricts = BANGLADESH_DISTRICTS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Filter areas by search query
  const filteredAreas = (currentDistrictObj?.areas || []).filter((a) =>
    a.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {activeStep === 'district'
                  ? (lang === 'bn' ? 'লোকেশন বা জেলা নির্বাচন করুন' : 'Select Location / District')
                  : (lang === 'bn' ? `${tempDistrict} এর এলাকা বা থানা` : `Select Area in ${tempDistrict}`)}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'আপনার কাছের স্থানীয় বিজ্ঞাপন খুঁজে পেতে লোকেশন নির্বাচন করুন'
                  : 'Find marketplace listings near you across Bangladesh'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Step 1: Detect Location Button */}
          {activeStep === 'district' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>{t.detectingLocation}</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.detectLocation}</span>
                  </>
                )}
              </button>

              {/* Status messages */}
              {detectError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{detectError}</span>
                </div>
              )}

              {detectSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{detectSuccess}</span>
                </div>
              )}
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeStep === 'district'
                  ? (lang === 'bn' ? 'জেলা খুঁজুন...' : 'Search district...')
                  : (lang === 'bn' ? 'এলাকা খুঁজুন...' : 'Search area...')
              }
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Step 1: District Selection */}
          {activeStep === 'district' && (
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {/* Option: All Bangladesh */}
              <button
                type="button"
                onClick={() => {
                  onSelectLocation('All', 'All');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  selectedDistrict === 'All'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4" />
                  <span>{t.allBangladesh}</span>
                </div>
                {selectedDistrict === 'All' && <Check className="w-3.5 h-3.5 text-white" />}
              </button>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 my-1" />

              {/* District List */}
              {filteredDistricts.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  {lang === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No districts found'}
                </p>
              ) : (
                filteredDistricts.map((district) => {
                  const isCurrent = selectedDistrict === district.name;
                  return (
                    <button
                      key={district.name}
                      type="button"
                      onClick={() => {
                        setTempDistrict(district.name);
                        setSearchQuery('');
                        setActiveStep('area');
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isCurrent
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{district.name}</span>
                        <span className="text-[10px] text-slate-400">
                          ({district.areas.length} {lang === 'bn' ? 'এলাকা' : 'areas'})
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Step 2: Area Selection */}
          {activeStep === 'area' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStep('district');
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  ← {lang === 'bn' ? 'অন্য জেলা নির্বাচন করুন' : 'Change District'}
                </button>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {tempDistrict}
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto pr-1 space-y-1">
                {/* Select All Areas in this District */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectLocation(tempDistrict, 'All');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    selectedDistrict === tempDistrict && selectedArea === 'All'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>
                    {lang === 'bn' ? `${tempDistrict} এর সব এলাকা` : `All areas in ${tempDistrict}`}
                  </span>
                  {selectedDistrict === tempDistrict && selectedArea === 'All' && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                {filteredAreas.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">
                    {lang === 'bn' ? 'কোনো এলাকা পাওয়া যায়নি' : 'No areas found'}
                  </p>
                ) : (
                  filteredAreas.map((area) => {
                    const isSelected = selectedDistrict === tempDistrict && selectedArea === area;
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          onSelectLocation(tempDistrict, area);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <span>{area}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
