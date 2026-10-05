import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Clock,
  LogOut,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Sliders,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { UserProfile } from '../types';
import { updateStudentProfile } from '../utils/auth';

interface StudentHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogout: () => void;
  onLoadDossierTopic: (topic: string) => void;
  onUpdateUser: (user: UserProfile) => void;
}

export const StudentHubModal: React.FC<StudentHubModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onLoadDossierTopic,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'stats' | 'settings'>('vault');
  const [selectedGrade, setSelectedGrade] = useState(user.gradeLevel);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const gradeNames: Record<string, string> = {
    middle: 'Middle School (Grades 6-8)',
    high: 'High School (Grades 9-12)',
    college: 'University / Undergraduate',
    lifelong: 'Lifelong Learner',
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updated = await updateStudentProfile({ gradeLevel: selectedGrade });
      onUpdateUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-paper-surface border border-paper-line rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Student Profile Card */}
        <div className="p-6 border-b border-paper-line bg-paper-surface-2/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/15 border-2 border-terracotta/30 overflow-hidden flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <GraduationCap className="w-7 h-7 text-terracotta" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif text-xl font-bold text-paper-text">{user.name}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-terracotta-50 text-terracotta-700 border border-terracotta-200">
                  {gradeNames[user.gradeLevel] || 'Student'}
                </span>
              </div>
              <p className="text-xs text-paper-text-dim mt-0.5">{user.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user.interests.slice(0, 3).map((int, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-paper-surface border border-paper-line text-paper-text-dim"
                  >
                    {int}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              title="Sign out of student account"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-paper-text-dim hover:text-red-500 hover:bg-paper-surface border border-paper-line transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-paper-text-dim hover:text-paper-text hover:bg-paper-surface transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-paper-line bg-paper-surface-2/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'vault'
                ? 'border-terracotta text-terracotta bg-paper-surface'
                : 'border-transparent text-paper-text-dim hover:text-paper-text'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Knowledge Vault ({user.savedDossiers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'stats'
                ? 'border-terracotta text-terracotta bg-paper-surface'
                : 'border-transparent text-paper-text-dim hover:text-paper-text'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Mastery & Achievements</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-terracotta text-terracotta bg-paper-surface'
                : 'border-transparent text-paper-text-dim hover:text-paper-text'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Learning Settings</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* 1. Knowledge Vault */}
          {activeTab === 'vault' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-paper-text-dim">
                <span>Personal study records saved from your research explorations</span>
                <span className="font-mono">{user.savedDossiers.length} Saved</span>
              </div>

              {user.savedDossiers.length === 0 ? (
                <div className="py-12 text-center max-w-sm mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-terracotta/10 text-terracotta mx-auto flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-paper-text">Knowledge Vault is Fresh</h3>
                  <p className="text-xs text-paper-text-dim leading-relaxed">
                    When exploring any topic in Deep Research, click <span className="font-semibold text-terracotta">&ldquo;Save to Learning Vault&rdquo;</span> to store your personal study dossiers here!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.savedDossiers.map((dossier) => (
                    <div
                      key={dossier.id}
                      className="p-4 rounded-xl bg-paper-surface-2 border border-paper-line hover:border-terracotta/40 transition-all shadow-paper-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-serif text-sm font-bold text-paper-text group-hover:text-terracotta transition-colors">
                            {dossier.topic}
                          </h4>
                          <span className="text-[10px] text-paper-text-dim flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(dossier.date).toLocaleDateString()}
                          </span>
                        </div>
                        {dossier.summarySnippet && (
                          <p className="text-xs text-paper-text-dim line-clamp-2 leading-relaxed">
                            {dossier.summarySnippet}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          onLoadDossierTopic(dossier.topic);
                          onClose();
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-paper-surface hover:bg-terracotta hover:text-white border border-paper-line text-xs font-semibold text-paper-text transition shrink-0 shadow-sm"
                      >
                        <span>Study Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Mastery & Stats */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-paper-surface-2 border border-paper-line text-center space-y-1">
                  <div className="w-9 h-9 rounded-xl bg-terracotta/10 text-terracotta mx-auto flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-paper-text">
                    {user.learningStats.topicsExplored}
                  </div>
                  <div className="text-xs text-paper-text-dim">Topics Explored</div>
                </div>

                <div className="p-4 rounded-2xl bg-paper-surface-2 border border-paper-line text-center space-y-1">
                  <div className="w-9 h-9 rounded-xl bg-sage/15 text-sage mx-auto flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-paper-text">
                    {user.learningStats.quizzesPassed}
                  </div>
                  <div className="text-xs text-paper-text-dim">Quizzes Mastered</div>
                </div>

                <div className="p-4 rounded-2xl bg-paper-surface-2 border border-paper-line text-center space-y-1">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-paper-text">
                    {user.learningStats.totalFocusMinutes}m
                  </div>
                  <div className="text-xs text-paper-text-dim">Deep Focus Time</div>
                </div>
              </div>

              {/* Quiz History */}
              <div className="space-y-3">
                <h4 className="font-serif text-sm font-bold text-paper-text flex items-center space-x-1.5">
                  <Trophy className="w-4 h-4 text-terracotta" />
                  <span>Recent Knowledge Concept Checks</span>
                </h4>

                {user.quizResults.length === 0 ? (
                  <p className="text-xs text-paper-text-dim italic">
                    No quizzes taken yet. Test your knowledge on any research topic by clicking &ldquo;Take Concept Quiz&rdquo;!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {user.quizResults.slice(0, 5).map((q) => {
                      const pct = Math.round((q.score / q.total) * 100);
                      const isHigh = pct >= 66;

                      return (
                        <div
                          key={q.id}
                          className="p-3 rounded-xl bg-paper-surface-2 border border-paper-line flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-paper-text">{q.topic}</span>
                            <span className="text-[10px] text-paper-text-dim block mt-0.5 font-mono">
                              {new Date(q.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
                                isHigh
                                  ? 'bg-sage/15 text-sage border border-sage/30'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {q.score} / {q.total} ({pct}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-paper-text mb-2">
                  Academic Level (adjusts AI explanation complexity)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'middle', label: 'Middle School', desc: 'Grades 6-8' },
                    { id: 'high', label: 'High School', desc: 'Grades 9-12' },
                    { id: 'college', label: 'University / College', desc: 'Higher Ed' },
                    { id: 'lifelong', label: 'Lifelong Learner', desc: 'Self-Directed' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedGrade(lvl.id as any)}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedGrade === lvl.id
                          ? 'border-terracotta bg-terracotta-50/50 text-paper-text shadow-sm'
                          : 'border-paper-line bg-paper-surface hover:bg-paper-surface-2 text-paper-text-dim'
                      }`}
                    >
                      <div className="text-xs font-bold text-terracotta-700 dark:text-terracotta-400">{lvl.label}</div>
                      <div className="text-[10px] text-paper-text-dim mt-0.5">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-paper-line">
                {saveSuccess ? (
                  <span className="text-xs text-sage font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Academic level updated!</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-paper-text-dim">
                    Changes take effect across all research briefings immediately.
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-terracotta text-white font-semibold text-xs shadow-sm hover:bg-terracotta-600 transition"
                >
                  Save Academic Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
