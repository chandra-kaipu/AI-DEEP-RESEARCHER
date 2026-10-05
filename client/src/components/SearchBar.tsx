import React, { useState, useRef } from 'react';
import { Search, Mic, MicOff, Upload, Globe, Sliders, ArrowRight, Loader2, FileText, X } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface SearchBarProps {
  onSearch: (topic: string, depth: 'quick' | 'deep', lang: string, file?: File) => void;
  isResearching: boolean;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
];

const SUGGESTIONS = [
  'Solid-State Battery Breakthroughs 2026',
  'Quantum Error Correction & Logical Qubits',
  'CRISPR Epigenome Editing & Longevity',
  'Small Modular Nuclear Reactors (SMRs)',
  'Post-Quantum Cryptography Migration',
];

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isResearching }) => {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'quick' | 'deep'>('quick');
  const [language, setLanguage] = useState('en');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, startListening, stopListening, hasSupport } = useSpeechRecognition((text) => {
    setTopic((prev) => (prev ? `${prev} ${text}` : text));
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() && !selectedFile) return;
    onSearch(topic, depth, language, selectedFile || undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!topic.trim()) {
        setTopic(`Analysis of ${file.name.replace(/\.[^/.]+$/, '')}`);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-paper-surface rounded-2xl border border-paper-line shadow-paper-md p-3 sm:p-4 transition-all focus-within:border-terracotta focus-within:shadow-paper-lg"
      >
        {/* Main topic input */}
        <div className="flex items-center space-x-3">
          <div className="text-terracotta pl-2">
            <Search className="w-6 h-6 stroke-[2.2]" />
          </div>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isResearching}
            placeholder="Enter research topic, technological vector, or question..."
            className="w-full bg-transparent text-paper-text text-base sm:text-lg font-serif placeholder:font-sans placeholder:text-paper-text-dim focus:outline-none py-2"
          />

          {/* Voice Input */}
          {hasSupport && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={isResearching}
              title={isListening ? 'Stop listening' : 'Dictate research topic'}
              className={`p-2 rounded-xl transition ${
                isListening
                  ? 'bg-terracotta-100 text-terracotta animate-pulse'
                  : 'text-paper-text-dim hover:text-terracotta hover:bg-paper-surface-2'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isResearching || (!topic.trim() && !selectedFile)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-600 disabled:opacity-50 text-white font-medium shadow-paper-sm transition transform active:scale-95 shrink-0"
          >
            {isResearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Researching...</span>
              </>
            ) : (
              <>
                <span>Synthesize</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Selected File Badge */}
        {selectedFile && (
          <div className="mt-3 flex items-center justify-between px-3 py-1.5 bg-paper-surface-2 rounded-lg border border-paper-line text-xs text-paper-text">
            <div className="flex items-center space-x-2 truncate">
              <FileText className="w-4 h-4 text-terracotta shrink-0" />
              <span className="font-medium truncate">Uploaded Source: {selectedFile.name}</span>
              <span className="text-paper-text-dim">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="p-1 hover:text-terracotta"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Configuration Row: Depth Slider, Language, File Upload */}
        <div className="mt-3 pt-3 border-t border-paper-line/60 flex flex-wrap items-center justify-between gap-3 text-xs text-paper-text-dim">
          <div className="flex flex-wrap items-center gap-3">
            {/* Depth Selector */}
            <div className="flex items-center space-x-1.5 bg-paper-surface-2 px-2.5 py-1 rounded-lg border border-paper-line">
              <Sliders className="w-3.5 h-3.5 text-terracotta" />
              <span className="font-medium text-paper-text">Depth:</span>
              <button
                type="button"
                onClick={() => setDepth('quick')}
                className={`px-2 py-0.5 rounded transition ${
                  depth === 'quick'
                    ? 'bg-paper-surface text-terracotta font-semibold shadow-xs'
                    : 'hover:text-paper-text'
                }`}
              >
                Quick (6 sources)
              </button>
              <button
                type="button"
                onClick={() => setDepth('deep')}
                className={`px-2 py-0.5 rounded transition ${
                  depth === 'deep'
                    ? 'bg-paper-surface text-terracotta font-semibold shadow-xs'
                    : 'hover:text-paper-text'
                }`}
              >
                Deep (12+ sources)
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center space-x-1.5 bg-paper-surface-2 px-2.5 py-1 rounded-lg border border-paper-line">
              <Globe className="w-3.5 h-3.5 text-dusty" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-paper-text focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Own Source Document */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-paper-surface-2 hover:bg-paper-line/50 transition border border-paper-line text-paper-text"
            >
              <Upload className="w-3.5 h-3.5 text-sage" />
              <span>Add PDF / Notes</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="text-[11px] text-paper-text-dim italic">
            Direct web retrieval & synthesis
          </div>
        </div>
      </form>

      {/* Exploration Topic Chips */}
      <div className="flex flex-wrap items-center gap-2 mt-2 px-2">
        <span className="text-xs text-paper-text-dim font-medium">Explore:</span>
        {SUGGESTIONS.map((sug) => (
          <button
            key={sug}
            type="button"
            onClick={() => {
              setTopic(sug);
              onSearch(sug, depth, language);
            }}
            disabled={isResearching}
            className="text-xs px-2.5 py-1 rounded-full bg-paper-surface/60 hover:bg-paper-surface border border-paper-line text-paper-text hover:border-terracotta transition"
          >
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
};
