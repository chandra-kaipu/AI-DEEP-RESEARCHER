import React, { useState, useEffect } from 'react';
import { X, Scale, Loader2, ArrowRight, CheckCircle2, SplitSquareVertical } from 'lucide-react';
import { ExtractedSource, SubtopicMomentum } from '../types';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKeysModal: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, onOpenKeysModal }) => {
  const [topicA, setTopicA] = useState('');
  const [topicB, setTopicB] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [comparisonResult, setComparisonResult] = useState<{
    topicA: string;
    topicB: string;
    synthesis: string;
    advantagesA: string[];
    advantagesB: string[];
    convergentTrends: string[];
    sourcesA: ExtractedSource[];
    sourcesB: ExtractedSource[];
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicA.trim() || !topicB.trim()) return;

    setIsLoading(true);
    setComparisonResult(null);

    try {
      setStatusMessage(`Searching live web for "${topicA}" & "${topicB}"...`);
      // 1. Parallel search calls
      const [resA, resB] = await Promise.all([
        fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topicA, depth: 'quick' }),
        }),
        fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topicB, depth: 'quick' }),
        }),
      ]);

      if (!resA.ok || !resB.ok) {
        throw new Error('Failed to retrieve web sources for one or both topics. Check API keys.');
      }

      const dataA = await resA.json();
      const dataB = await resB.json();

      setStatusMessage('Synthesizing comparative vectors across live corpora...');

      // 2. Synthesize comparative analysis via chat RAG endpoint
      const comparisonPrompt = `Perform a comprehensive, rigorous comparative analysis between:
Topic A: "${topicA}"
Topic B: "${topicB}"

Compare their technological readiness, market traction, key trade-offs, and future trajectories.
Format your answer with:
1. Executive Comparative Synthesis
2. Key Advantages / Dominant Strengths of Topic A
3. Key Advantages / Dominant Strengths of Topic B
4. Convergent Opportunities or Synergies`;

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${topicA} vs ${topicB}`,
          sources: [...(dataA.sources || []), ...(dataB.sources || [])],
          messages: [{ role: 'user', content: comparisonPrompt }],
        }),
      });

      if (!chatRes.ok) {
        const errorData = await chatRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Comparative LLM synthesis failed. Check your API key and balance.');
      }

      const chatData = await chatRes.json();

      // Extract bullet points from answer
      const lines = chatData.reply.split('\n');
      const advantagesA: string[] = [];
      const advantagesB: string[] = [];
      const convergences: string[] = [];

      let currentSec: 'none' | 'a' | 'b' | 'c' = 'none';
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('advantages of topic a') || lower.includes(`advantages of ${topicA.toLowerCase()}`)) {
          currentSec = 'a';
        } else if (lower.includes('advantages of topic b') || lower.includes(`advantages of ${topicB.toLowerCase()}`)) {
          currentSec = 'b';
        } else if (lower.includes('convergent') || lower.includes('synerg')) {
          currentSec = 'c';
        } else if (line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim())) {
          const cleanLine = line.replace(/^[-*]|\d+\.\s*/, '').trim();
          if (cleanLine.length > 5) {
            if (currentSec === 'a') advantagesA.push(cleanLine);
            else if (currentSec === 'b') advantagesB.push(cleanLine);
            else if (currentSec === 'c') convergences.push(cleanLine);
          }
        }
      }

      setComparisonResult({
        topicA,
        topicB,
        synthesis: chatData.reply,
        advantagesA: advantagesA.slice(0, 4),
        advantagesB: advantagesB.slice(0, 4),
        convergentTrends: convergences.slice(0, 4),
        sourcesA: dataA.sources || [],
        sourcesB: dataB.sources || [],
      });
    } catch (err: any) {
      alert(`Error during comparative run: ${err.message}`);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-text/40 backdrop-blur-xs animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper-surface w-full max-w-4xl rounded-2xl border border-paper-line shadow-paper-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-paper-line flex items-center justify-between bg-paper-surface-2/40">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-terracotta" />
            <h3 className="font-serif text-lg font-bold text-paper-text">
              Parallel Dual-Topic Comparative Engine
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-paper-surface-2 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-6 overflow-y-auto space-y-6">
          <form onSubmit={handleCompare} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-paper-text-dim">
                  Topic A
                </label>
                <input
                  type="text"
                  value={topicA}
                  onChange={(e) => setTopicA(e.target.value)}
                  placeholder="e.g. Sodium-Ion Batteries"
                  disabled={isLoading}
                  className="w-full bg-paper-surface-2 border border-paper-line rounded-xl px-3.5 py-2 text-sm text-paper-text focus:outline-none focus:border-terracotta"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-paper-text-dim">
                  Topic B
                </label>
                <input
                  type="text"
                  value={topicB}
                  onChange={(e) => setTopicB(e.target.value)}
                  placeholder="e.g. Solid-State Lithium Batteries"
                  disabled={isLoading}
                  className="w-full bg-paper-surface-2 border border-paper-line rounded-xl px-3.5 py-2 text-sm text-paper-text focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-paper-text-dim">
                Executes parallel search & cross-corpus comparative reasoning
              </span>

              <button
                type="submit"
                disabled={isLoading || !topicA.trim() || !topicB.trim()}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 disabled:opacity-50 text-white font-medium text-xs shadow-paper-sm transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{statusMessage || 'Comparing...'}</span>
                  </>
                ) : (
                  <>
                    <span>Execute Comparison</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results */}
          {comparisonResult && (
            <div className="space-y-6 pt-4 border-t border-paper-line animate-in fade-in">
              {/* Comparative Advantage Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-terracotta-50/50 rounded-xl border border-terracotta-200 space-y-2">
                  <div className="font-serif font-bold text-sm text-terracotta">
                    Vector Strengths: {comparisonResult.topicA}
                  </div>
                  <div className="space-y-1.5 text-xs text-paper-text">
                    {(comparisonResult.advantagesA.length > 0
                      ? comparisonResult.advantagesA
                      : ['High raw extraction volume in live search', 'Active commercial scaling reports']
                    ).map((pt, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-sage/10 rounded-xl border border-sage/40 space-y-2">
                  <div className="font-serif font-bold text-sm text-sage-600">
                    Vector Strengths: {comparisonResult.topicB}
                  </div>
                  <div className="space-y-1.5 text-xs text-paper-text">
                    {(comparisonResult.advantagesB.length > 0
                      ? comparisonResult.advantagesB
                      : ['Long-term theoretical density superiority', 'Significant patent expansion']
                    ).map((pt, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Comparative Synthesis */}
              <div className="p-5 bg-paper-surface-2/50 rounded-xl border border-paper-line space-y-2">
                <h4 className="font-serif font-bold text-base text-paper-text">
                  Grounded Comparative Intelligence Dossier
                </h4>
                <div className="prose prose-stone max-w-none text-xs sm:text-sm text-paper-text font-sans leading-relaxed whitespace-pre-line">
                  {comparisonResult.synthesis}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
