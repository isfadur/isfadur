import React from 'react';
import { X, Mail, Phone, MapPin, Shield, CheckCircle } from 'lucide-react';

export type InfoModalType = 'about' | 'contact' | 'privacy' | 'terms' | 'safety' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">
            {type === 'about' && 'About ISFADUR'}
            {type === 'contact' && 'Contact Support'}
            {type === 'privacy' && 'Privacy Policy'}
            {type === 'terms' && 'Terms & Conditions'}
            {type === 'safety' && 'Safe Trading Guide (Bangladesh)'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-sm text-slate-700 space-y-4 max-h-[75vh] overflow-y-auto leading-relaxed">
          {type === 'about' && (
            <div className="space-y-3">
              <p>
                <strong>ISFADUR</strong> (BUY • SELL • CONNECT) is an ultra-lightweight, community-first online marketplace built specifically for Bangladesh.
              </p>
              <p>
                Our philosophy is simple: provide a fast, accessible platform where everyday individuals, artisans, small traders, and service providers across all 64 districts of Bangladesh can buy and sell goods directly without unnecessary friction, paid paywalls, or complicated login procedures.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 mt-2">
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                  Our Core Pillars:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Low Cost & Minimal Overhead:</strong> Engineered for maximum efficiency and lowest server footprint.</li>
                  <li><strong>Human Moderation:</strong> Every advertisement is checked before publishing to eliminate fraud, spam, and clone accounts.</li>
                  <li><strong>Direct Peer-to-Peer Connection:</strong> Instant WhatsApp and phone communication with zero middleman commissions.</li>
                </ul>
              </div>
            </div>
          )}

          {type === 'contact' && (
            <div className="space-y-4">
              <p>
                Have questions, spotted an infringing listing, or need assistance? Reach out to the ISFADUR community support team.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Email Support</div>
                    <div className="font-semibold text-slate-900">support@isfadur.com.bd</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Helpline (Bangladesh)</div>
                    <div className="font-semibold text-slate-900">+880 1700-000000 (10 AM - 8 PM)</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Headquarters</div>
                    <div className="font-semibold text-slate-900">Dhaka, Bangladesh</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'privacy' && (
            <div className="space-y-3 text-xs">
              <p><strong>Last Updated: October 2026</strong></p>
              <p>
                At ISFADUR, we take your privacy seriously. Because we intentionally operate without compulsory account creation or third-party behavioral advertising trackers, our data footprint is extraordinarily minimal:
              </p>
              <h4 className="font-bold text-slate-900 text-sm">1. Information We Collect</h4>
              <p>
                When you post an advertisement, you provide your name, contact phone number, item description, location (district and area), and optional photos. This information is published solely to facilitate prospective buyers reaching out to you.
              </p>
              <h4 className="font-bold text-slate-900 text-sm">2. Image Storage</h4>
              <p>
                Photos uploaded to ISFADUR are compressed directly in your browser prior to saving, reducing unnecessary bandwidth consumption and data retention.
              </p>
              <h4 className="font-bold text-slate-900 text-sm">3. No Third-Party Reselling</h4>
              <p>
                We do not sell, rent, or trade your personal information or contact details to third-party telemarketers or data brokers.
              </p>
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-3 text-xs">
              <p><strong>Last Updated: October 2026</strong></p>
              <p>
                By using ISFADUR, you agree to comply with Bangladesh digital commerce laws and these terms:
              </p>
              <h4 className="font-bold text-slate-900 text-sm">1. Ad Review & Approval</h4>
              <p>
                Every submitted advertisement enters a pending review state. Administrators reserve the sole right to approve, reject, or modify listings that violate safety, copyright, or community standards.
              </p>
              <h4 className="font-bold text-slate-900 text-sm">2. Prohibited Items</h4>
              <p>
                Listings for counterfeit products, stolen goods, prescription medications, weapons, pirated materials, or misleading job schemes are strictly prohibited and will be reported to appropriate authorities.
              </p>
              <h4 className="font-bold text-slate-900 text-sm">3. Peer-to-Peer Transactions</h4>
              <p>
                ISFADUR operates as an information directory connecting buyers and sellers. All negotiations, item inspections, and payments occur directly between parties.
              </p>
            </div>
          )}

          {type === 'safety' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-2">
                <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Protect yourself against common scams in online classifieds across Bangladesh.
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Never send advance payments:</strong> Refuse requests to pay booking fees or courier advance via bKash, Nagad, or Rocket before seeing the physical item.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Meet in secure public locations:</strong> Choose busy public places such as metro stations, university campuses, or shopping centers during daytime.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Inspect electronics thoroughly:</strong> Verify IMEI numbers on BTRC portal for smartphones, check battery health, and test all functions on site.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Check vehicle paperwork:</strong> For motorcycles or cars, ensure BRTA smart registration cards and tax tokens match the seller's national identity card (NID).</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
