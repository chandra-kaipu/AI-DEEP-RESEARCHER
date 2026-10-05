import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  X,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { login, signup, loginWithGoogle } from '../utils/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<'middle' | 'high' | 'college' | 'lifelong'>('high');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Science',
    'Technology',
    'History',
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google quick-login prompt
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  if (!isOpen) return null;

  const academicInterestsList = [
    'Science & Physics',
    'Technology & AI',
    'Space Exploration',
    'World History',
    'Biology & Medicine',
    'Mathematics & Logic',
    'Literature & Philosophy',
    'Environmental Science',
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await signup({
        email,
        password,
        name,
        gradeLevel,
        role: 'student',
        interests: selectedInterests,
      });
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gEmail = googleEmailInput.trim();
    if (!gEmail || !gEmail.includes('@')) {
      setError('Please provide a valid Google email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await loginWithGoogle({
        email: gEmail,
        name: gEmail.split('@')[0],
      });
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-paper-surface border border-paper-line rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-paper-line flex items-center justify-between bg-paper-surface-2/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-terracotta/15 flex items-center justify-center text-terracotta">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-paper-text">Student Knowledge Portal</h2>
              <p className="text-xs text-paper-text-dim">Empowering self-directed student research</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-paper-text-dim hover:text-paper-text hover:bg-paper-surface transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-paper-line bg-paper-surface-2/40 text-xs font-semibold">
          <button
            onClick={() => {
              setTab('signin');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              tab === 'signin'
                ? 'border-terracotta text-terracotta bg-paper-surface'
                : 'border-transparent text-paper-text-dim hover:text-paper-text'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              tab === 'signup'
                ? 'border-terracotta text-terracotta bg-paper-surface'
                : 'border-transparent text-paper-text-dim hover:text-paper-text'
            }`}
          >
            Create Student Account
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Google Sign-In Option */}
          {!googlePromptOpen ? (
            <button
              type="button"
              onClick={() => setGooglePromptOpen(true)}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl border border-paper-line hover:border-gray-400 bg-white text-gray-700 dark:bg-[#1E252B] dark:text-gray-200 dark:hover:border-gray-600 transition shadow-sm font-medium text-xs sm:text-sm group"
            >
              {/* Google G SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google Mail</span>
            </button>
          ) : (
            <form onSubmit={handleGoogleSubmit} className="p-3.5 rounded-xl bg-paper-surface-2 border border-paper-line space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-paper-text flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-terracotta" />
                  <span>Google Mail Address</span>
                </span>
                <button
                  type="button"
                  onClick={() => setGooglePromptOpen(false)}
                  className="text-[11px] text-paper-text-dim hover:text-paper-text"
                >
                  Cancel
                </button>
              </div>
              <input
                type="email"
                required
                autoFocus
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full px-3 py-2 rounded-lg bg-paper-surface border border-paper-line text-xs focus:ring-1 focus:ring-terracotta focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 rounded-lg bg-terracotta text-white text-xs font-medium hover:bg-terracotta-600 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Authorize & Connect Student Profile</span>
              </button>
            </form>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-paper-line"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase font-mono text-paper-text-dim">
              or use student password
            </span>
            <div className="flex-grow border-t border-paper-line"></div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-paper-text mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-paper-text-dim" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@school.edu or gmail.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-paper-surface border border-paper-line text-xs text-paper-text focus:ring-2 focus:ring-terracotta focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-paper-text mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-paper-text-dim" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-paper-surface border border-paper-line text-xs text-paper-text focus:ring-2 focus:ring-terracotta focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-terracotta text-white font-medium text-xs hover:bg-terracotta-600 transition shadow-sm flex items-center justify-center space-x-1.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In to Learning Vault</span>}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-paper-text mb-1">Student Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-paper-text-dim" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-paper-surface border border-paper-line text-xs text-paper-text focus:ring-2 focus:ring-terracotta focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-paper-text mb-1">Student Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-paper-text-dim" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@school.edu or gmail.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-paper-surface border border-paper-line text-xs text-paper-text focus:ring-2 focus:ring-terracotta focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-paper-text mb-1">Create Password (min 6 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-paper-text-dim" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a secure password"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-paper-surface border border-paper-line text-xs text-paper-text focus:ring-2 focus:ring-terracotta focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-paper-text mb-1">Current Academic Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'middle', label: 'Middle School', desc: 'Grades 6-8' },
                    { id: 'high', label: 'High School', desc: 'Grades 9-12' },
                    { id: 'college', label: 'University / College', desc: 'Higher Ed' },
                    { id: 'lifelong', label: 'Lifelong Learner', desc: 'Self-Directed' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setGradeLevel(lvl.id as any)}
                      className={`p-2 rounded-xl border text-left transition ${
                        gradeLevel === lvl.id
                          ? 'border-terracotta bg-terracotta-50/50 text-paper-text shadow-sm'
                          : 'border-paper-line bg-paper-surface hover:bg-paper-surface-2 text-paper-text-dim'
                      }`}
                    >
                      <div className="text-xs font-bold text-terracotta-700 dark:text-terracotta-400">{lvl.label}</div>
                      <div className="text-[10px] text-paper-text-dim">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-paper-text mb-1.5">
                  Learning Interests (select all that spark curiosity)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {academicInterestsList.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                          isSelected
                            ? 'bg-sage/15 border-sage text-sage font-medium'
                            : 'bg-paper-surface border-paper-line text-paper-text-dim hover:border-gray-400'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-terracotta text-white font-medium text-xs hover:bg-terracotta-600 transition shadow-sm flex items-center justify-center space-x-1.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Start My Student Journey</span>}
                {!isLoading && <Sparkles className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-paper-line bg-paper-surface-2/40 text-[11px] text-paper-text-dim flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-sage" />
            <span>Educational Free Tier &bull; Private Student Data</span>
          </span>
          <span className="font-mono">v1.0 Live</span>
        </div>
      </div>
    </div>
  );
};
