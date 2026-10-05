import React, { useState, useEffect } from 'react';
import { X, Key, Check, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import { KeyStatus } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyStatus?: KeyStatus;
  onSaveKeys: (keys: {
    searchKey?: string;
    searchProvider?: string;
    llmKey?: string;
    llmProvider?: string;
    imageKey?: string;
    imageProvider?: string;
  }) => Promise<void>;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  keyStatus,
  onSaveKeys,
}) => {
  const [searchKey, setSearchKey] = useState('');
  const [searchProvider, setSearchProvider] = useState(keyStatus?.searchProvider || 'auto');
  const [llmKey, setLlmKey] = useState('');
  const [llmProvider, setLlmProvider] = useState(keyStatus?.llmProvider || 'anthropic');
  const [imageKey, setImageKey] = useState('');
  const [imageProvider, setImageProvider] = useState(keyStatus?.imageProvider || 'openai');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_deep_researcher_keys');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.searchKey) setSearchKey(parsed.searchKey);
        if (parsed.searchProvider) setSearchProvider(parsed.searchProvider);
        if (parsed.llmKey) setLlmKey(parsed.llmKey);
        if (parsed.llmProvider) setLlmProvider(parsed.llmProvider);
        if (parsed.imageKey) setImageKey(parsed.imageKey);
        if (parsed.imageProvider) setImageProvider(parsed.imageProvider);
      }
    } catch {}
  }, [isOpen]);

  const handleSearchKeyChange = (val: string) => {
    setSearchKey(val);
    const trimmed = val.trim();
    if (trimmed.startsWith('tvly-')) {
      setSearchProvider('tavily');
    }
  };

  const handleLlmKeyChange = (val: string) => {
    setLlmKey(val);
    const trimmed = val.trim();
    if (trimmed.startsWith('sk-or-')) {
      setLlmProvider('openrouter');
    } else if (trimmed.startsWith('AIzaSy') || trimmed.toLowerCase().startsWith('aq')) {
      setLlmProvider('gemini');
    } else if (trimmed.startsWith('sk-ant-')) {
      setLlmProvider('anthropic');
    } else if (trimmed.startsWith('sk-') || trimmed.startsWith('org-')) {
      setLlmProvider('openai');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const keyConfig = {
        searchKey: searchKey.trim() || undefined,
        searchProvider,
        llmKey: llmKey.trim() || undefined,
        llmProvider,
        imageKey: imageKey.trim() || undefined,
        imageProvider,
      };

      try {
        localStorage.setItem('ai_deep_researcher_keys', JSON.stringify(keyConfig));
        if (keyConfig.llmKey) localStorage.setItem('llmApiKey', keyConfig.llmKey);
        if (keyConfig.llmProvider) localStorage.setItem('llmProvider', keyConfig.llmProvider);
        if (keyConfig.searchKey) localStorage.setItem('searchApiKey', keyConfig.searchKey);
        if (keyConfig.searchProvider) localStorage.setItem('searchProvider', keyConfig.searchProvider);
      } catch {}

      await onSaveKeys(keyConfig);
      setSaveSuccess(true);
      onClose();
    } catch (err) {
      console.error(err);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-text/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper-surface w-full max-w-lg rounded-2xl border border-paper-line shadow-paper-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-paper-line flex items-center justify-between bg-paper-surface-2/40">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-terracotta" />
            <h3 className="font-serif text-lg font-bold text-paper-text">
              API Keys & Engine Setup
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-paper-text-dim hover:text-paper-text hover:bg-paper-line/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          <div className="p-3 bg-paper-surface-2 rounded-xl border border-paper-line text-xs text-paper-text-dim leading-relaxed">
            <span className="font-semibold text-paper-text">Zero-Mock Rule:</span> Every feature requires a real API call. You can supply keys below for this session, or define them in your server’s <code className="bg-paper-surface px-1 py-0.5 rounded border border-paper-line text-terracotta">.env</code> or Replit Secrets.
          </div>

          {/* Search Provider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-paper-text flex items-center space-x-1.5">
                <span>Web Search Provider</span>
                {searchProvider === 'auto' ? (
                  <span className="inline-flex items-center text-[11px] text-sage font-medium">
                    <Check className="w-3.5 h-3.5 mr-0.5" /> Free & Active (No Key Needed)
                  </span>
                ) : keyStatus?.searchKeySet ? (
                  <span className="inline-flex items-center text-[11px] text-sage font-medium">
                    <Check className="w-3.5 h-3.5 mr-0.5" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] text-dusty font-medium">
                    (Auto-falls back to Live Web)
                  </span>
                )}
              </label>
              {searchProvider !== 'auto' && (
                <a
                  href="https://tavily.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-dusty hover:underline flex items-center"
                >
                  Get Tavily Key <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}
            </div>
            <div className="flex space-x-2">
              <select
                value={searchProvider}
                onChange={(e) => setSearchProvider(e.target.value)}
                className="bg-paper-surface-2 border border-paper-line rounded-lg px-2 text-xs text-paper-text focus:outline-none"
              >
                <option value="auto">Autonomous Live Web (Free - No Key)</option>
                <option value="tavily">Tavily Search</option>
                <option value="serpapi">SerpAPI</option>
                <option value="bing">Bing Web</option>
              </select>
              <input
                type="password"
                placeholder={
                  searchProvider === 'auto'
                    ? 'Autonomous Live Web active (no API key needed)'
                    : keyStatus?.searchKeySet
                    ? '•••••••••••••••• (Leave blank to keep existing)'
                    : 'tvly-... (Optional, falls back to Live Web)'
                }
                value={searchKey}
                onChange={(e) => handleSearchKeyChange(e.target.value)}
                disabled={searchProvider === 'auto'}
                className="w-full bg-paper-surface-2 border border-paper-line rounded-lg px-3 py-1.5 text-paper-text placeholder:text-paper-text-dim focus:outline-none focus:border-terracotta disabled:opacity-60"
              />
            </div>
          </div>

          {/* LLM Provider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-paper-text flex items-center space-x-1.5">
                <span>LLM Intelligence Key</span>
                {keyStatus?.llmKeySet ? (
                  <span className="inline-flex items-center text-[11px] text-sage font-medium">
                    <Check className="w-3.5 h-3.5 mr-0.5" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] text-terracotta font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 mr-0.5" /> Needed
                  </span>
                )}
              </label>
              <div className="flex items-center space-x-2">
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-terracotta hover:underline flex items-center font-medium"
                >
                  OpenRouter Key <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sage hover:underline flex items-center font-medium"
                >
                  Free Gemini <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-dusty hover:underline flex items-center"
                >
                  OpenAI <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                className="bg-paper-surface-2 border border-paper-line rounded-lg px-2 text-xs text-paper-text focus:outline-none"
              >
                <option value="openrouter">OpenRouter (Claude 3.5, Gemini, DeepSeek)</option>
                <option value="gemini">Google Gemini (Free Tier)</option>
                <option value="openai">OpenAI GPT-4o</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
              <input
                type="password"
                placeholder={keyStatus?.llmKeySet ? '•••••••••••••••• (Leave blank to keep existing)' : 'sk-or-v1-... or AIzaSy... or sk-...'}
                value={llmKey}
                onChange={(e) => handleLlmKeyChange(e.target.value)}
                className="w-full bg-paper-surface-2 border border-paper-line rounded-lg px-3 py-1.5 text-paper-text placeholder:text-paper-text-dim focus:outline-none focus:border-terracotta"
              />
            </div>
          </div>

          {/* Image Provider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-paper-text flex items-center space-x-1.5">
                <span>Image Generation Key (Optional)</span>
                {keyStatus?.imageKeySet ? (
                  <span className="inline-flex items-center text-[11px] text-sage font-medium">
                    <Check className="w-3.5 h-3.5 mr-0.5" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] text-paper-text-dim">
                    Uses OpenAI key if set
                  </span>
                )}
              </label>
              <span className="text-[11px] text-paper-text-dim">DALL-E 3</span>
            </div>
            <div className="flex space-x-2">
              <select
                value={imageProvider}
                onChange={(e) => setImageProvider(e.target.value)}
                className="bg-paper-surface-2 border border-paper-line rounded-lg px-2 text-xs text-paper-text focus:outline-none"
              >
                <option value="openai">OpenAI DALL-E</option>
                <option value="stability">Stability AI</option>
              </select>
              <input
                type="password"
                placeholder={keyStatus?.imageKeySet ? '••••••••••••••••' : 'sk-... or leave blank to share LLM key'}
                value={imageKey}
                onChange={(e) => setImageKey(e.target.value)}
                className="w-full bg-paper-surface-2 border border-paper-line rounded-lg px-3 py-1.5 text-paper-text placeholder:text-paper-text-dim focus:outline-none focus:border-terracotta"
              />
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start space-x-2 text-xs text-paper-text-dim pt-2">
            <ShieldCheck className="w-4 h-4 text-sage shrink-0 mt-0.5" />
            <span>
              Keys are held securely server-side in Node.js and are never exposed in browser network responses or client bundles.
            </span>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-paper-line flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-paper-line text-paper-text hover:bg-paper-surface-2 transition text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-terracotta hover:bg-terracotta-600 text-white transition text-xs font-medium flex items-center space-x-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Apply Engine Keys</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
