import React, { useState } from 'react';
import {
  BookOpenCheck,
  Sparkles,
  RefreshCw,
  Lightbulb,
  Cpu,
  BookA,
  AlertTriangle,
  Target,
  CheckCircle,
  Copy,
  Check,
  Wand2,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { TextExplanationResult, ParentalControlConfig } from '../../types';
import { getStoredApiKeys } from '../../utils/keys';
import { checkSafety, logParentalSearch } from '../../utils/safety';

interface TextExplainerToolProps {
  onOpenKeysModal?: () => void;
  parentalConfig?: ParentalControlConfig;
}

export const TextExplainerTool: React.FC<TextExplainerToolProps> = ({ onOpenKeysModal, parentalConfig }) => {
  const [text, setText] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TextExplanationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleTexts = [
    {
      label: 'Transformer Self-Attention',
      snippet: `Self-attention allows the model to associate each word in the input with other words. Mathematically, given input vectors X, we compute Query (Q), Key (K), and Value (V) projection matrices. Attention weights are computed by taking the dot product of Q and K, dividing by the square root of the key dimension (scale factor), and passing through a softmax function to obtain probabilities over values. This enables parallelized contextual encoding unlike sequential RNNs.`,
    },
    {
      label: 'Zero-Knowledge Proofs',
      snippet: `A zero-knowledge proof is a cryptographic protocol where one party (the prover) can prove to another party (the verifier) that a given statement is true, without conveying any information apart from the fact that the statement is indeed true. In zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge), polynomial commitments and arithmetic circuits ensure proofs are verifiable in milliseconds without revealing private witness inputs.`,
    },
    {
      label: 'Quantum Superposition',
      snippet: `In quantum mechanics, superposition is a fundamental principle stating that physical systems may exist in a linear combination of multiple distinct states simultaneously. Described by a state vector |Ψ⟩ in a Hilbert space, probabilities are determined by the squared amplitude of complex probability amplitudes. Upon wave-function collapse (measurement), the system abruptly resolves into a single eigenstate of the observable operator.`,
    },
  ];

  const handleExplain = async (customText?: string) => {
    const textToUse = (customText || text).trim();
    if (!textToUse) {
      setError('Please paste or write some text to explain.');
      return;
    }

    if (parentalConfig?.enabled) {
      const safety = checkSafety(textToUse, parentalConfig);
      if (!safety.isSafe) {
        logParentalSearch({
          topic: textToUse.slice(0, 150),
          tool: 'text-explainer',
          status: 'intercepted',
          interceptReason: safety.reason,
          category: safety.category,
        });
        setError(`SafeGuard Intercept: ${safety.reason || 'This text contains inappropriate topics blocked by parental controls.'}`);
        return;
      }
    }

    logParentalSearch({
      topic: textToUse.slice(0, 150),
      tool: 'text-explainer',
      status: 'allowed',
    });

    const { llmKey, llmProvider } = getStoredApiKeys();
    if (!llmKey) {
      setError('MISSING_KEY:LLM_API_KEY: Please set your Google Gemini or LLM API key via the "API Setup" modal in the top navigation.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const effectiveInstructions = [
      parentalConfig?.kidMode ? 'Explain at a friendly, middle-school level with fun, relatable everyday analogies suitable for young students.' : '',
      instructions.trim(),
    ].filter(Boolean).join(' ');

    try {
      const res = await fetch('/api/tools/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          instructions: effectiveInstructions || undefined,
          customKey: llmKey,
          customProvider: llmProvider || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setResult(data.explanation);
    } catch (err: any) {
      console.error('Explanation error:', err);
      setError(err.message || 'Failed to generate explanation.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const formatted = `# ${result.title}\n\n${result.summary}\n\n## Analogy\n${result.intuitiveAnalogy.analogy}\n${result.intuitiveAnalogy.explanation}\n\n## Core Mechanisms\n${result.coreMechanisms.map(m => `${m.step}. ${m.title}: ${m.description}`).join('\n')}\n\n## Key Takeaways\n${result.keyTakeaways.map(t => `- ${t}`).join('\n')}`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1B2A32]/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#D97757]/10 text-[#D97757]">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1B2A32]">
              Deep Text Explainer
            </h1>
            <p className="text-xs text-[#1B2A32]/60">
              Transform dense papers, technical documentation, or contracts into first-principles mental models, intuitive analogies, and deconstructed mechanisms
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-[#1B2A32]/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70">
                Text or Document Excerpt
              </label>
              <span className="text-[10px] text-[#1B2A32]/40 font-mono">
                {text.length} chars
              </span>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste dense paragraph, research paper excerpt, algorithm description, or complex concept here..."
              rows={8}
              className="w-full p-3.5 rounded-xl border border-[#1B2A32]/15 bg-[#FAF7F0]/50 text-xs text-[#1B2A32] placeholder:text-[#1B2A32]/40 focus:outline-none focus:ring-2 focus:ring-[#D97757]/50 resize-none transition-all leading-relaxed"
            />

            <div>
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70 block mb-1">
                Explanation Angle (Optional)
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Focus on software architecture, or explain for a high school student..."
                className="w-full p-3 rounded-xl border border-[#1B2A32]/15 bg-[#FAF7F0]/50 text-xs text-[#1B2A32] placeholder:text-[#1B2A32]/40 focus:outline-none focus:ring-2 focus:ring-[#D97757]/50"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2">
                <div className="leading-relaxed">{error}</div>
                {onOpenKeysModal && (
                  <button
                    type="button"
                    onClick={onOpenKeysModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D97757] text-white text-xs font-medium hover:bg-[#c26547] transition-colors cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Open API Setup</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => handleExplain()}
              disabled={isLoading || !text.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D97757] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#c26547] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Deconstructing & Synthesizing Explanation...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Explain Deeply</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#1B2A32]/10 space-y-2">
            <span className="text-[10px] font-mono uppercase font-semibold text-[#1B2A32]/50 flex items-center gap-1">
              <Wand2 className="w-3 h-3 text-[#D97757]" />
              Quick Sample Concepts
            </span>
            <div className="space-y-1.5">
              {sampleTexts.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setText(s.snippet);
                    handleExplain(s.snippet);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-[#1B2A32]/10 hover:border-[#D97757]/40 bg-white hover:bg-[#D97757]/5 transition-all text-xs group"
                >
                  <span className="font-semibold text-[#1B2A32] block group-hover:text-[#D97757]">
                    {s.label}
                  </span>
                  <span className="text-[11px] text-[#1B2A32]/50 line-clamp-1 mt-0.5">
                    {s.snippet}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Main Card */}
              <div className="p-6 rounded-2xl bg-white border border-[#1B2A32]/10 shadow-sm space-y-5">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1B2A32]/10">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#1B2A32]">
                      {result.title}
                    </h2>
                    <p className="text-xs text-[#1B2A32]/70 mt-1 leading-relaxed">
                      {result.summary}
                    </p>
                  </div>
                  <button
                    onClick={copyAll}
                    className="p-2 rounded-lg border border-[#1B2A32]/15 text-[#1B2A32]/60 hover:text-[#D97757] flex items-center gap-1 text-xs transition-colors flex-shrink-0"
                    title="Copy full explanation"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Intuitive Analogy Box */}
                <div className="p-4 rounded-xl bg-[#FAF7F0] border-l-4 border-[#D97757] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#D97757]">
                    <Lightbulb className="w-4 h-4" />
                    Intuitive Mental Model & Analogy
                  </div>
                  <p className="text-sm font-serif italic text-[#1B2A32] leading-snug">
                    "{result.intuitiveAnalogy.analogy}"
                  </p>
                  <p className="text-xs text-[#1B2A32]/70 leading-relaxed pt-1">
                    {result.intuitiveAnalogy.explanation}
                  </p>
                </div>

                {/* Core Mechanisms */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70">
                    <Cpu className="w-4 h-4 text-[#D97757]" />
                    Under-The-Hood Mechanics
                  </div>
                  <div className="space-y-2.5">
                    {result.coreMechanisms.map((mech) => (
                      <div
                        key={mech.step}
                        className="p-3.5 rounded-xl border border-[#1B2A32]/10 bg-[#FAF7F0]/40 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#2B3A4A] text-white font-mono text-[10px] flex items-center justify-center font-bold">
                            {mech.step}
                          </span>
                          <span className="text-xs font-semibold text-[#1B2A32]">
                            {mech.title}
                          </span>
                        </div>
                        <p className="text-xs text-[#1B2A32]/70 pl-7 leading-relaxed">
                          {mech.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Glossary */}
                {result.technicalGlossary && result.technicalGlossary.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70">
                      <BookA className="w-4 h-4 text-[#D97757]" />
                      Jargon Unpacked into Plain English
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.technicalGlossary.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-[#1B2A32]/10 bg-white space-y-1"
                        >
                          <span className="text-xs font-mono font-bold text-[#D97757] block">
                            {item.term}
                          </span>
                          <p className="text-[11px] text-[#1B2A32]/70 leading-relaxed">
                            {item.plainEnglish}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden Assumptions & Where It Breaks */}
                {result.assumptionsAndCaveats && result.assumptionsAndCaveats.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-700">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Hidden Assumptions & Boundary Conditions
                    </div>
                    <ul className="space-y-1.5 pl-1">
                      {result.assumptionsAndCaveats.map((c, idx) => (
                        <li key={idx} className="text-xs text-[#1B2A32]/70 flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Practical Example */}
                {result.practicalExample && (
                  <div className="p-4 rounded-xl bg-[#2B3A4A]/5 border border-[#2B3A4A]/15 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#2B3A4A]">
                      <Target className="w-3.5 h-3.5" />
                      Concrete Real-World Scenario
                    </div>
                    <p className="text-xs text-[#1B2A32]/80 leading-relaxed">
                      <strong>Scenario:</strong> {result.practicalExample.scenario}
                    </p>
                    <p className="text-xs text-[#1B2A32]/80 leading-relaxed">
                      <strong>Outcome:</strong> {result.practicalExample.outcome}
                    </p>
                  </div>
                )}

                {/* Key Takeaways */}
                <div className="space-y-2 pt-2 border-t border-[#1B2A32]/10">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Essential Takeaways
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {result.keyTakeaways.map((takeaway, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2"
                      >
                        <span className="text-emerald-700 font-bold">✓</span>
                        <span>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-white border border-dashed border-[#1B2A32]/20 flex flex-col items-center justify-center text-center space-y-3 min-h-[380px]">
              <div className="p-4 rounded-2xl bg-[#D97757]/10 text-[#D97757]">
                <BookOpenCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#1B2A32]">
                Awaiting Text for Deep Explanation
              </h3>
              <p className="text-xs text-[#1B2A32]/60 max-w-sm">
                Paste technical documentation, complex algorithmic descriptions, or academic papers to break them down into intuitive analogies and clear mechanics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
