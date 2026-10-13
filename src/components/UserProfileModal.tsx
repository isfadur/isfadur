import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  User,
  Mail,
  Calendar,
  LogOut,
  Edit2,
  Check,
  Package,
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMyAds: () => void;
  lang?: 'en' | 'bn';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenMyAds,
  lang = 'en',
}) => {
  const { user, profile, logout, updateUserProfile } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.displayName || user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      await updateUserProfile(nameInput.trim());
      setIsEditingName(false);
      setStatusMessage(lang === 'bn' ? 'নাম আপডেট হয়েছে।' : 'Display name updated.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const createdDate = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent Member';

  const initial = (profile?.displayName || user.displayName || user.email || 'U')[0].toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">
              {lang === 'bn' ? 'আমার একাউন্ট প্রোফাইল' : 'My User Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Avatar & Display Name */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-inner shrink-0">
              {initial}
            </div>
            <div className="grow min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
                    placeholder="Enter name"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                    title="Save"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setNameInput(profile?.displayName || user.displayName || '');
                    }}
                    className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {profile?.displayName || user.displayName || 'Member'}
                  </h3>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Edit display name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
              {statusMessage}
            </div>
          )}

          {/* Account Details */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'bn' ? 'ইমেইল' : 'Email Address'}</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                {user.email}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'bn' ? 'যোগদানের তারিখ' : 'Member Since'}</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {createdDate}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'bn' ? 'নিরাপত্তা স্থিতি' : 'Security Status'}</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                Firebase Protected
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenMyAds();
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>{lang === 'bn' ? 'আমার বিজ্ঞাপনসমূহ পরিচালনা করুন' : 'Manage My Ads'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'bn' ? 'লগআউট করুন' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
