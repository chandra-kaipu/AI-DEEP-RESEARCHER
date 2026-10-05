import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, BookOpen, KeyRound, ArrowRight } from 'lucide-react';
import { SafetyCheckResult } from '../utils/safety';

interface SafeGuardShieldProps {
  blockedTopic: string;
  safetyResult: SafetyCheckResult;
  onSelectAlternative: (topic: string) => void;
  onOpenParentalSettings: () => void;
  onParentBypass?: () => void;
  parentPin: string;
}

export const SafeGuardShield: React.FC<SafeGuardShieldProps> = ({
  blockedTopic,
  safetyResult,
  onSelectAlternative,
  onOpenParentalSettings,
  onParentBypass,
  parentPin,
}) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === parentPin) {
      setPinError(false);
      setShowPinInput(false);
      if (onParentBypass) {
        onParentBypass();
      } else {
        onOpenParentalSettings();
      }
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 sm:p-8 bg-paper-surface/90 border-2 border-amber-500/40 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-paper-line">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg sm:text-xl font-bold text-paper-text">
                SafeGuard Protection Active
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                Filtered Query
              </span>
            </div>
            <p className="text-xs text-paper-text-dim mt-0.5">
              Parental controls are actively screening search queries to maintain a safe, wholesome learning environment.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPinInput(!showPinInput)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-paper-text-dim hover:text-paper-text bg-paper-surface-2 border border-paper-line transition"
        >
          <KeyRound className="w-3.5 h-3.5 text-terracotta" />
          <span>Parent Unlock</span>
        </button>
      </div>

      {/* Query Reason Notice */}
      <div className="mt-5 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 text-xs sm:text-sm">
        <p className="text-paper-text font-medium">
          <span className="font-semibold text-amber-700 dark:text-amber-400">Restricted Notice: </span>
          The requested query <span className="font-mono bg-paper-surface px-1.5 py-0.5 rounded border border-paper-line text-terracotta font-semibold">&ldquo;{blockedTopic}&rdquo;</span> cannot be processed under the current parental safety guidelines.
        </p>
        {safetyResult.reason && (
          <p className="text-paper-text-dim mt-1.5 text-xs">
            Reason: {safetyResult.reason}
          </p>
        )}
      </div>

      {/* PIN Unlock Dropdown */}
      {showPinInput && (
        <form onSubmit={handleVerifyPin} className="mt-4 p-4 rounded-xl bg-paper-surface-2 border border-paper-line flex flex-col sm:flex-row items-center gap-3 animate-in fade-in">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-xs font-semibold text-paper-text mb-1">Enter Parent 4-Digit PIN to Override or Adjust</label>
            <input
              type="password"
              maxLength={6}
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value);
                setPinError(false);
              }}
              placeholder="Enter PIN (e.g. 1234)"
              autoFocus
              className="w-full px-3 py-1.5 rounded-lg bg-paper-surface border border-paper-line text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {pinError && <p className="text-xs text-red-500 mt-1 font-medium">Incorrect PIN. Try again.</p>}
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto self-end">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Verify PIN
            </button>
            <button
              type="button"
              onClick={onOpenParentalSettings}
              className="px-3 py-1.5 rounded-lg bg-paper-surface hover:bg-paper-surface-2 text-paper-text text-xs border border-paper-line transition"
            >
              Open Settings
            </button>
          </div>
        </form>
      )}

      {/* Wholesome & Kid-Friendly Suggested Topics */}
      <div className="mt-6">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-terracotta" />
          <h3 className="font-serif text-sm sm:text-base font-bold text-paper-text">
            Inspiring Curiosity: Explore These Great Topics Instead
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {safetyResult.suggestedAlternatives.map((altTopic, idx) => (
            <button
              key={idx}
              onClick={() => onSelectAlternative(altTopic)}
              className="group text-left p-3.5 rounded-xl bg-paper-surface hover:bg-paper-surface-2 border border-paper-line hover:border-terracotta/40 transition-all shadow-paper-sm flex items-start justify-between gap-3"
            >
              <div className="flex items-start space-x-2.5">
                <BookOpen className="w-4 h-4 text-sage shrink-0 mt-0.5 group-hover:text-terracotta transition-colors" />
                <span className="text-xs sm:text-sm font-medium text-paper-text group-hover:text-terracotta transition-colors leading-snug">
                  {altTopic}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-paper-text-dim group-hover:text-terracotta group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Safety Badge footer */}
      <div className="mt-6 pt-4 border-t border-paper-line flex items-center justify-between text-[11px] text-paper-text-dim">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sage" />
          <span>SafeGuard filtering protects student curiosity across search, synthesis, and creative tools.</span>
        </div>
        <button
          onClick={onOpenParentalSettings}
          className="hover:underline text-terracotta font-medium"
        >
          Configure SafeGuard
        </button>
      </div>
    </div>
  );
};
