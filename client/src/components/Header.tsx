import React from 'react';
import { Sun, Moon, Key, History, Scale, Sparkles, ShieldCheck, Shield, Brain, GraduationCap } from 'lucide-react';
import { KeyStatus, UserProfile } from '../types';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenKeysModal: () => void;
  onOpenHistory: () => void;
  onOpenCompare: () => void;
  onOpenParentalModal?: () => void;
  isParentalActive?: boolean;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
  keyStatus?: KeyStatus;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
  onOpenStudentHub?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleTheme,
  onOpenKeysModal,
  onOpenHistory,
  onOpenCompare,
  onOpenParentalModal,
  isParentalActive,
  onToggleFocusMode,
  isFocusMode,
  keyStatus,
  currentUser,
  onOpenAuthModal,
  onOpenStudentHub,
}) => {
  const allCoreKeysReady = keyStatus?.searchKeySet && keyStatus?.llmKeySet;

  return (
    <header className="w-full border-b border-paper-line bg-paper-surface/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-terracotta flex items-center justify-center text-white shadow-paper-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-paper-text">
                AI Deep Researcher
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-terracotta-50 text-terracotta-700 border border-terracotta-200">
                Live & Generative
              </span>
            </div>
            <p className="hidden sm:block text-xs text-paper-text-dim">
              Live web search, multi-source extraction, trend analytics & synthesis
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Student Knowledge Portal / Account */}
          {currentUser ? (
            <button
              onClick={onOpenStudentHub}
              title="Open Student Knowledge Vault & Mastery"
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-800 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800 hover:border-terracotta transition shadow-sm"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-terracotta/20 flex items-center justify-center shrink-0">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-terracotta" />
                )}
              </div>
              <span className="text-xs font-semibold max-w-[90px] truncate hidden sm:inline">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.2 rounded bg-terracotta/10 border border-terracotta/20 text-terracotta uppercase">
                {currentUser.gradeLevel}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Sign In or Create Free Student Account"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-terracotta hover:bg-terracotta-600 transition shadow-paper-sm"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Sign In</span>
            </button>
          )}

          {/* Compare Mode */}
          <button
            onClick={onOpenCompare}
            title="Compare two research topics side-by-side"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-paper-text hover:bg-paper-surface-2 transition border border-paper-line"
          >
            <Scale className="w-4 h-4 text-dusty" />
            <span className="hidden md:inline">Compare Mode</span>
          </button>

          {/* Zen Focus Mode Toggle */}
          <button
            onClick={onToggleFocusMode}
            title="Toggle Zen Focus Mode (Alt+F)"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition border ${
              isFocusMode
                ? 'bg-terracotta text-white border-terracotta shadow-paper-sm'
                : 'text-paper-text hover:bg-paper-surface-2 border-paper-line'
            }`}
          >
            <Brain className={`w-4 h-4 ${isFocusMode ? 'text-white' : 'text-terracotta'}`} />
            <span className="hidden md:inline">Zen Focus</span>
          </button>

          {/* Parental Control SafeGuard */}
          <button
            onClick={onOpenParentalModal}
            title={isParentalActive ? 'Parental SafeGuard is Active' : 'Configure Parental SafeGuard'}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition border ${
              isParentalActive
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/60 shadow-sm'
                : 'text-paper-text hover:bg-paper-surface-2 border-paper-line'
            }`}
          >
            {isParentalActive ? (
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Shield className="w-4 h-4 text-paper-text-dim" />
            )}
            <span className="hidden lg:inline">SafeGuard</span>
            {isParentalActive && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          {/* Research Library / History */}
          <button
            onClick={onOpenHistory}
            title="Saved research sessions"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-paper-text hover:bg-paper-surface-2 transition border border-paper-line"
          >
            <History className="w-4 h-4 text-sage" />
            <span className="hidden md:inline">Library</span>
          </button>

          {/* API Keys Configuration */}
          <button
            onClick={onOpenKeysModal}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition border ${
              allCoreKeysReady
                ? 'bg-paper-surface text-paper-text border-paper-line hover:border-terracotta'
                : 'bg-terracotta-50 text-terracotta-700 border-terracotta-300 animate-pulse'
            }`}
          >
            <Key className="w-4 h-4 text-terracotta" />
            <span className="hidden sm:inline">API Setup</span>
            <span
              className={`w-2 h-2 rounded-full ${
                allCoreKeysReady ? 'bg-sage' : 'bg-terracotta'
              }`}
            />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-md text-paper-text-dim hover:text-paper-text hover:bg-paper-surface-2 transition border border-paper-line"
          >
            {isDark ? <Sun className="w-4 h-4 text-terracotta-400" /> : <Moon className="w-4 h-4 text-dusty" />}
          </button>
        </div>
      </div>
    </header>
  );
};
