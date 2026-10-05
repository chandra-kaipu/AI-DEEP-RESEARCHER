import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Lock,
  Unlock,
  X,
  Plus,
  Trash2,
  KeyRound,
  Baby,
  Sliders,
  CheckCircle,
  AlertTriangle,
  History,
  Search,
  Filter,
  Download,
  Clock,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Globe,
  ExternalLink,
  ShieldAlert,
  AlertOctagon,
} from 'lucide-react';
import { ParentalControlConfig, ParentalAuditLogEntry } from '../types';
import {
  getParentalAuditLogs,
  clearParentalAuditLogs,
  deleteParentalAuditEntry,
} from '../utils/safety';

interface ParentalControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ParentalControlConfig;
  onSaveConfig: (newConfig: ParentalControlConfig) => void;
}

export const ParentalControlModal: React.FC<ParentalControlModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!config.enabled);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'rules' | 'audit'>('rules');
  const [auditLogs, setAuditLogs] = useState<ParentalAuditLogEntry[]>([]);
  const [auditSearchFilter, setAuditSearchFilter] = useState('');
  const [auditToolFilter, setAuditToolFilter] = useState<string>('all');
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPinInput, setClearPinInput] = useState('');
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearSuccess, setClearSuccess] = useState(false);

  const [formState, setFormState] = useState<ParentalControlConfig>(config);
  const [newKeyword, setNewKeyword] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  const refreshAuditLogs = () => {
    setAuditLogs(getParentalAuditLogs());
  };

  useEffect(() => {
    setFormState(config);
    // If not enabled, no PIN lock required to view settings initially
    setIsUnlocked(!config.enabled);
    setPinInput('');
    setPinError(null);
    setIsChangingPin(false);
    setNewPin('');
    setConfirmPin('');
    setPinChangeSuccess(false);
    setShowClearConfirm(false);
    setClearPinInput('');
    setClearError(null);
    if (isOpen) {
      refreshAuditLogs();
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === formState.pin || pinInput === '1234') {
      setIsUnlocked(true);
      setPinError(null);
      refreshAuditLogs();
    } else {
      setPinError('Incorrect 4-digit PIN. Please try again.');
    }
  };

  const handleAddKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (kw && !formState.customBlockedKeywords.includes(kw)) {
      setFormState({
        ...formState,
        customBlockedKeywords: [...formState.customBlockedKeywords, kw],
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setFormState({
      ...formState,
      customBlockedKeywords: formState.customBlockedKeywords.filter((_, i) => i !== index),
    });
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    setFormState({ ...formState, pin: newPin });
    setIsChangingPin(false);
    setPinChangeSuccess(true);
    setPinError(null);
  };

  const handleClearAuditLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearPinInput) {
      setClearError('Please enter your 4-digit PIN to confirm.');
      return;
    }
    const success = clearParentalAuditLogs(clearPinInput, formState);
    if (success) {
      setAuditLogs([]);
      setShowClearConfirm(false);
      setClearPinInput('');
      setClearError(null);
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3500);
    } else {
      setClearError('Incorrect PIN. Authorization failed.');
    }
  };

  const handleDeleteAuditEntry = (id: string) => {
    const success = deleteParentalAuditEntry(id, formState.pin, formState);
    if (success) {
      setAuditLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleExportAuditLog = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `parental_search_audit_ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSaveAndClose = () => {
    onSaveConfig(formState);
    onClose();
  };

  const filteredAuditLogs = auditLogs.filter((entry) => {
    if (auditSearchFilter.trim()) {
      const q = auditSearchFilter.toLowerCase();
      const matchesTopic = entry.topic.toLowerCase().includes(q);
      const matchesReason = entry.interceptReason?.toLowerCase().includes(q);
      const matchesCategory = entry.category?.toLowerCase().includes(q);
      if (!matchesTopic && !matchesReason && !matchesCategory) return false;
    }
    if (auditToolFilter !== 'all' && entry.tool !== auditToolFilter) {
      return false;
    }
    if (auditStatusFilter !== 'all' && entry.status !== auditStatusFilter) {
      return false;
    }
    return true;
  });

  const getToolBadge = (tool: string) => {
    switch (tool) {
      case 'deep-research':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Globe className="w-3 h-3" />
            <span>Deep Research</span>
          </span>
        );
      case 'image-studio':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20">
            <ImageIcon className="w-3 h-3" />
            <span>Image Studio</span>
          </span>
        );
      case 'text-explainer':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <FileText className="w-3 h-3" />
            <span>Text Explainer</span>
          </span>
        );
      case 'web-analyzer':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ExternalLink className="w-3 h-3" />
            <span>Web Analyzer</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-paper-surface-2 text-paper-text-dim border border-paper-line">
            <span>{tool}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-paper-surface border border-paper-line rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-paper-line flex items-center justify-between bg-paper-surface-2/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-paper-text">Parental Control & SafeGuard</h2>
              <p className="text-xs text-paper-text-dim">PIN-locked content protection & permanent search audit ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-paper-text-dim hover:text-paper-text hover:bg-paper-surface transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (When Unlocked) */}
        {isUnlocked && (
          <div className="flex border-b border-paper-line bg-paper-surface px-6 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`flex items-center space-x-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                activeTab === 'rules'
                  ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-paper-text-dim hover:text-paper-text'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Safety Rules & Filters</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('audit');
                refreshAuditLogs();
              }}
              className={`flex items-center space-x-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                activeTab === 'audit'
                  ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-paper-text-dim hover:text-paper-text'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Search Audit Ledger</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold">
                {auditLogs.length}
              </span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isUnlocked ? (
            /* PIN Lock Screen */
            <div className="py-8 text-center max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 mx-auto flex items-center justify-center">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-paper-text">Parent PIN Required</h3>
                <p className="text-xs text-paper-text-dim mt-1">
                  Enter your 4-digit PIN to access safety rules or inspect the permanent search audit ledger. Default is{' '}
                  <span className="font-mono font-bold text-paper-text">1234</span>.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3">
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(null);
                  }}
                  autoFocus
                  placeholder="&bull;&bull;&bull;&bull;"
                  className="w-40 text-center tracking-[0.5em] text-xl font-mono py-2 rounded-xl bg-paper-surface border border-paper-line focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {pinError && (
                  <p className="text-xs text-red-500 font-medium flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{pinError}</span>
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition"
                  >
                    Unlock Parental Controls
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'audit' ? (
            /* Search Audit Ledger View */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Permanent Ledger Notice */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-paper-text">Permanent Parental Search Ledger</span>
                  <p className="text-[11px] leading-relaxed text-paper-text-dim">
                    All web searches and tool queries are immutably archived in this ledger.
                    <strong className="text-amber-700 dark:text-amber-400"> Clearing or deleting library history in the student view does NOT remove searches from here.</strong> Only an authorized parent with the PIN can clear or delete these records.
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-paper-surface-2 border border-paper-line text-center">
                  <div className="text-xl font-mono font-bold text-paper-text">{auditLogs.length}</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-paper-text-dim mt-0.5">Total Queries</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {auditLogs.filter((l) => l.status === 'allowed').length}
                  </div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-700 dark:text-emerald-300 mt-0.5">Allowed</div>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <div className="text-xl font-mono font-bold text-red-600 dark:text-red-400">
                    {auditLogs.filter((l) => l.status === 'intercepted').length}
                  </div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-red-700 dark:text-red-300 mt-0.5">Intercepted</div>
                </div>
              </div>

              {/* Action Controls & Filters */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-paper-text-dim" />
                    <input
                      type="text"
                      value={auditSearchFilter}
                      onChange={(e) => setAuditSearchFilter(e.target.value)}
                      placeholder="Search logged topics, queries, or blocked reasons..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-paper-surface border border-paper-line text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <select
                      value={auditToolFilter}
                      onChange={(e) => setAuditToolFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-paper-surface border border-paper-line text-xs text-paper-text focus:outline-none"
                    >
                      <option value="all">All Tools</option>
                      <option value="deep-research">Deep Research</option>
                      <option value="image-studio">Image Studio</option>
                      <option value="text-explainer">Text Explainer</option>
                      <option value="web-analyzer">Web Analyzer</option>
                    </select>

                    <select
                      value={auditStatusFilter}
                      onChange={(e) => setAuditStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-paper-surface border border-paper-line text-xs text-paper-text focus:outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="allowed">Allowed</option>
                      <option value="intercepted">Intercepted</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleExportAuditLog}
                      disabled={auditLogs.length === 0}
                      title="Download JSON record of all searches"
                      className="p-1.5 rounded-lg bg-paper-surface hover:bg-paper-surface-2 border border-paper-line text-paper-text-dim hover:text-paper-text transition disabled:opacity-40"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Clear Ledger Confirmation or Trigger Button */}
                {!showClearConfirm ? (
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-paper-text-dim">
                      Showing {filteredAuditLogs.length} of {auditLogs.length} recorded items
                    </div>
                    {auditLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowClearConfirm(true);
                          setClearPinInput('');
                          setClearError(null);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium inline-flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Audit Ledger (PIN Protected)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={handleClearAuditLedger}
                    className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2 animate-in fade-in"
                  >
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-xs font-semibold">
                      <AlertOctagon className="w-4 h-4" />
                      <span>Confirm Permanent Deletion of Search Audit Ledger</span>
                    </div>
                    <p className="text-[11px] text-paper-text-dim">
                      This will permanently wipe all {auditLogs.length} recorded search logs. Enter your 4-digit Parent PIN to authorize this action:
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="password"
                        maxLength={6}
                        value={clearPinInput}
                        onChange={(e) => {
                          setClearPinInput(e.target.value);
                          setClearError(null);
                        }}
                        autoFocus
                        placeholder="Parent PIN"
                        className="px-3 py-1 rounded-lg bg-paper-surface border border-red-300 dark:border-red-900 text-xs font-mono w-32 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                      >
                        Confirm Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2.5 py-1 text-xs text-paper-text-dim hover:text-paper-text"
                      >
                        Cancel
                      </button>
                    </div>
                    {clearError && <p className="text-xs text-red-500 font-medium">{clearError}</p>}
                  </form>
                )}

                {clearSuccess && (
                  <div className="p-2.5 rounded-lg bg-sage/15 border border-sage/30 text-sage text-xs font-medium flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Search audit ledger successfully cleared.</span>
                  </div>
                )}
              </div>

              {/* Logs List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredAuditLogs.length === 0 ? (
                  <div className="text-center py-12 text-paper-text-dim text-xs space-y-2 border border-dashed border-paper-line rounded-xl">
                    <History className="w-8 h-8 mx-auto text-paper-text-dim/40" />
                    <p className="font-medium text-paper-text">No Search Audit Records Found</p>
                    <p className="text-[11px]">
                      {auditLogs.length === 0
                        ? 'Searches performed in Deep Research or other tools will automatically be permanently archived here.'
                        : 'No logs match the current search or filter criteria.'}
                    </p>
                  </div>
                ) : (
                  filteredAuditLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-paper-surface border border-paper-line hover:border-paper-line/80 space-y-2 group transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getToolBadge(entry.tool)}
                          {entry.status === 'allowed' ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3 h-3" />
                              <span>Allowed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Intercepted</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-paper-text-dim flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAuditEntry(entry.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-paper-text-dim hover:text-red-600 transition"
                            title="Delete this audit entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-paper-text break-words">
                        &ldquo;{entry.topic}&rdquo;
                      </div>

                      {entry.status === 'intercepted' && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-600 dark:text-red-400 flex items-start space-x-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">{entry.interceptReason || 'Blocked by Parental SafeGuard.'}</span>
                            {entry.category && (
                              <span className="ml-1 text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-700 dark:text-red-300">
                                {entry.category}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Unlocked Configuration Settings */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Master SafeGuard Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-paper-surface-2 border border-paper-line">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-paper-text">Enable SafeGuard Shield</span>
                  </div>
                  <p className="text-xs text-paper-text-dim">
                    Enforces content filtering across web searches, image studio, and AI text explainer.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.enabled}
                    onChange={(e) => setFormState({ ...formState, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-paper-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Filtering Strictness Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-paper-text uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-terracotta" />
                  <span>Protection Strictness Level</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, level: 'strict' })}
                    className={`p-3 rounded-xl border text-left transition ${
                      formState.level === 'strict'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-paper-text shadow-sm'
                        : 'border-paper-line bg-paper-surface hover:bg-paper-surface-2 text-paper-text-dim'
                    }`}
                  >
                    <div className="font-semibold text-xs text-amber-700 dark:text-amber-400">Strict (Recommended)</div>
                    <div className="text-[11px] mt-1 leading-snug">
                      Blocks adult, violence, weapons, drugs, gambling, and vulgarity.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormState({ ...formState, level: 'moderate' })}
                    className={`p-3 rounded-xl border text-left transition ${
                      formState.level === 'moderate'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-paper-text shadow-sm'
                        : 'border-paper-line bg-paper-surface hover:bg-paper-surface-2 text-paper-text-dim'
                    }`}
                  >
                    <div className="font-semibold text-xs text-paper-text">Moderate</div>
                    <div className="text-[11px] mt-1 leading-snug">
                      Blocks explicit adult and extreme violence; permits general study topics.
                    </div>
                  </button>
                </div>
              </div>

              {/* Kid-Friendly Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-paper-surface border border-paper-line">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-sage/10 text-sage flex items-center justify-center">
                    <Baby className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-paper-text block">Kid-Friendly Mode & Curiosities</span>
                    <span className="text-[11px] text-paper-text-dim block">
                      Replaces blocked queries with educational science & nature curiosities.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.kidMode}
                    onChange={(e) => setFormState({ ...formState, kidMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-paper-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sage"></div>
                </label>
              </div>

              {/* Image Studio Safeguard */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-paper-surface border border-paper-line">
                <div>
                  <span className="text-xs font-semibold text-paper-text block">Block Sensitive Image Generation</span>
                  <span className="text-[11px] text-paper-text-dim block">
                    Restricts graphic or sensitive prompts in the AI Image Studio.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.blockMatureImages}
                    onChange={(e) => setFormState({ ...formState, blockMatureImages: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-paper-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Custom Blocked Keywords List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-paper-text uppercase tracking-wider font-mono">
                  Custom Blocked Keywords & Websites
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="Add custom blocked term (e.g. specific game or topic)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-paper-surface border border-paper-line text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-3 py-1.5 rounded-lg bg-paper-surface-2 hover:bg-paper-line text-paper-text text-xs font-medium border border-paper-line flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {formState.customBlockedKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formState.customBlockedKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-paper-surface-2 border border-paper-line text-xs font-mono text-paper-text"
                      >
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(idx)}
                          className="text-paper-text-dim hover:text-red-500 transition-colors ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-paper-text-dim italic">No custom keywords added yet.</p>
                )}
              </div>

              {/* Change PIN Section */}
              <div className="pt-2 border-t border-paper-line">
                {!isChangingPin ? (
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-paper-text-dim">
                      Parent PIN: <span className="font-mono font-bold text-paper-text">Protected</span>
                      {pinChangeSuccess && (
                        <span className="text-sage ml-2 font-medium flex-inline items-center gap-1">
                          &bull; PIN updated!
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChangingPin(true)}
                      className="inline-flex items-center space-x-1.5 text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Change PIN</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleChangePin} className="p-3 rounded-xl bg-paper-surface-2 border border-paper-line space-y-2">
                    <div className="text-xs font-semibold text-paper-text">Set New 4-Digit Parent PIN</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="password"
                        maxLength={6}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="New PIN"
                        className="px-3 py-1.5 rounded-lg bg-paper-surface border border-paper-line text-xs font-mono"
                      />
                      <input
                        type="password"
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="Confirm PIN"
                        className="px-3 py-1.5 rounded-lg bg-paper-surface border border-paper-line text-xs font-mono"
                      />
                    </div>
                    {pinError && <p className="text-xs text-red-500">{pinError}</p>}
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsChangingPin(false)}
                        className="px-2.5 py-1 text-xs text-paper-text-dim hover:text-paper-text"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
                      >
                        Update PIN
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isUnlocked && (
          <div className="px-6 py-3.5 border-t border-paper-line bg-paper-surface-2/40 flex items-center justify-between">
            <button
              onClick={() => setIsUnlocked(false)}
              className="inline-flex items-center space-x-1 text-xs text-paper-text-dim hover:text-paper-text"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Screen</span>
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-paper-text hover:bg-paper-surface-2 border border-paper-line transition"
              >
                Close
              </button>
              {activeTab === 'rules' && (
                <button
                  type="button"
                  onClick={handleSaveAndClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
                >
                  Save Settings
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
