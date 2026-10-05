import React, { useState, useRef } from 'react';
import { BookOpen, Sparkles, Volume2, VolumeX, CheckCircle, Copy, Check } from 'lucide-react';
import { SummaryResult } from '../types';

interface SummaryPanelProps {
  summary: SummaryResult | null;
  topic: string;
  isMissingKey?: boolean;
  onOpenKeysModal: () => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summary,
  topic,
  isMissingKey = false,
  onOpenKeysModal,
}) => {
  const [mode, setMode] = useState<'deep' | 'basic'>('deep');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleCopy = () => {
    if (!summary) return;
    const textToCopy =
      mode === 'deep'
        ? `${summary.executiveSummary}\n\n` +
          summary.detailedSections.map((s) => `### ${s.heading}\n${s.content}`).join('\n\n')
        : summary.summary_basic;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAudioNarration = async () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (!summary) return;
    const textToSpeak = mode === 'deep' ? summary.executiveSummary : summary.summary_basic;

    try {
      // First try calling backend TTS endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
          setIsPlayingAudio(true);
          audioRef.current.onended = () => setIsPlayingAudio(false);
        }
      } else {
        // Fallback to Web Speech API
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.onend = () => setIsPlayingAudio(false);
          utterance.onerror = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(utterance);
          setIsPlayingAudio(true);
        }
      }
    } catch {
      // Fallback to browser SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  if (isMissingKey) {
    return (
      <div className="bg-paper-surface rounded-2xl border border-dashed border-terracotta/40 p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-terracotta-50 flex items-center justify-center text-terracotta">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="font-serif text-lg font-bold text-paper-text">
          LLM Synthesis Key Required
        </h4>
        <p className="text-sm text-paper-text-dim max-w-md mx-auto">
          Add <code className="bg-paper-surface-2 px-1.5 py-0.5 rounded text-terracotta font-mono">LLM_API_KEY</code> (Anthropic Claude or OpenAI) to generate comprehensive research briefings and basic explanations.
        </p>
        <button
          onClick={onOpenKeysModal}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-medium hover:bg-terracotta-600 transition"
        >
          Add LLM Key
        </button>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-paper-surface rounded-2xl border border-paper-line shadow-paper-sm p-6 sm:p-8 space-y-6">
      <audio ref={audioRef} className="hidden" />

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-paper-line">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-terracotta" />
            <h3 className="font-serif text-2xl font-bold text-paper-text">
              Research Synthesis
            </h3>
          </div>
          <p className="text-xs text-paper-text-dim mt-0.5">
            Grounded in live search corpus &bull; Language: {summary.language.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Audio listen button */}
          <button
            onClick={handleAudioNarration}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              isPlayingAudio
                ? 'bg-terracotta-50 border-terracotta text-terracotta animate-pulse'
                : 'bg-paper-surface-2 border-paper-line text-paper-text hover:border-terracotta'
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-terracotta" />}
            <span>{isPlayingAudio ? 'Stop Audio' : 'Listen'}</span>
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            title="Copy summary"
            className="p-1.5 rounded-lg bg-paper-surface-2 border border-paper-line text-paper-text-dim hover:text-paper-text transition"
          >
            {copied ? <Check className="w-4 h-4 text-sage" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Mode switch: Executive vs ELI5 Basic */}
          <div className="flex items-center bg-paper-surface-2 p-0.5 rounded-lg border border-paper-line text-xs">
            <button
              onClick={() => setMode('deep')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                mode === 'deep'
                  ? 'bg-paper-surface text-terracotta shadow-xs font-semibold'
                  : 'text-paper-text-dim hover:text-paper-text'
              }`}
            >
              Editorial Paper
            </button>
            <button
              onClick={() => setMode('basic')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md transition font-medium ${
                mode === 'basic'
                  ? 'bg-paper-surface text-terracotta shadow-xs font-semibold'
                  : 'text-paper-text-dim hover:text-paper-text'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
              <span>Basic (ELI5)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content View */}
      {mode === 'basic' ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-terracotta-50 border border-terracotta-200 text-xs font-medium text-terracotta-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plain Language &bull; Jargon Free &bull; Intuitive Breakdown</span>
          </div>

          <div className="prose prose-stone max-w-none text-paper-text font-sans leading-relaxed text-base bg-paper-surface-2/40 p-6 rounded-xl border border-paper-line">
            <p className="whitespace-pre-line">{summary.summary_basic}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Summary */}
          <div className="bg-paper-surface-2/50 border-l-4 border-terracotta p-5 rounded-r-xl">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-terracotta mb-2">
              Executive Briefing
            </h4>
            <p className="text-paper-text font-serif text-base sm:text-lg leading-relaxed">
              {summary.executiveSummary}
            </p>
          </div>

          {/* Key Takeaways */}
          {summary.takeaways && summary.takeaways.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-paper-text-dim">
                Key Strategic Takeaways
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {summary.takeaways.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2 p-3 bg-paper-surface-2/30 rounded-xl border border-paper-line text-xs text-paper-text"
                  >
                    <CheckCircle className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Thematic Sections */}
          <div className="space-y-6 pt-2">
            {summary.detailedSections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-serif text-xl font-bold text-paper-text border-b border-paper-line/50 pb-1">
                  {sec.heading}
                </h4>
                <div className="text-paper-text text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
                  {sec.content}
                </div>
                {sec.citations && sec.citations.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-paper-text-dim">
                    <span className="font-medium">Sources cited:</span>
                    {sec.citations.map((cite, cIdx) => (
                      <a
                        key={cIdx}
                        href={cite}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded bg-paper-surface-2 hover:bg-paper-line text-dusty transition truncate max-w-[200px]"
                      >
                        {new URL(cite).hostname.replace('www.', '')}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
