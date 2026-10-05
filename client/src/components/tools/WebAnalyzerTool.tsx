import React, { useState } from 'react';
import {
  Globe2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Coins,
  Users,
  Compass,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  Key,
} from 'lucide-react';
import { WebAnalysisResult, ParentalControlConfig } from '../../types';
import { getStoredApiKeys } from '../../utils/keys';
import { checkSafety, logParentalSearch } from '../../utils/safety';

interface ScrapedMeta {
  title: string;
  metaDescription: string;
  headingCount: number;
  textSampleLength: number;
}

interface WebAnalyzerToolProps {
  onOpenKeysModal?: () => void;
  parentalConfig?: ParentalControlConfig;
}

export const WebAnalyzerTool: React.FC<WebAnalyzerToolProps> = ({ onOpenKeysModal, parentalConfig }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WebAnalysisResult | null>(null);
  const [pageMeta, setPageMeta] = useState<ScrapedMeta | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleUrls = [
    { label: 'Anthropic AI', url: 'https://anthropic.com' },
    { label: 'Linear App', url: 'https://linear.app' },
    { label: 'Hugging Face', url: 'https://huggingface.co' },
    { label: 'Supabase', url: 'https://supabase.com' },
  ];

  const handleAnalyze = async (customUrl?: string) => {
    const targetUrl = (customUrl || url).trim();
    if (!targetUrl) {
      setError('Please enter a website URL.');
      return;
    }

    if (parentalConfig?.enabled) {
      const safety = checkSafety(targetUrl, parentalConfig);
      if (!safety.isSafe) {
        logParentalSearch({
          topic: targetUrl,
          tool: 'web-analyzer',
          status: 'intercepted',
          interceptReason: safety.reason,
          category: safety.category,
        });
        setError(`SafeGuard Intercept: ${safety.reason || 'This website domain is restricted by parental controls.'}`);
        return;
      }
    }

    logParentalSearch({
      topic: targetUrl,
      tool: 'web-analyzer',
      status: 'allowed',
    });

    const { llmKey, llmProvider } = getStoredApiKeys();
    if (!llmKey) {
      setError('MISSING_KEY:LLM_API_KEY: Please set your Google Gemini or LLM API key via the "API Setup" modal in the top navigation.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tools/web-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          customKey: llmKey,
          customProvider: llmProvider || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setPageMeta(data.pageMeta);
    } catch (err: any) {
      console.error('Web audit failed:', err);
      setError(err.message || 'Failed to scrape and analyze website.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReport = () => {
    if (!analysis) return;
    const report = `# Web Intelligence Audit: ${analysis.url}\nActivity Score: ${analysis.activityScore}/100\n\n## Overview\n${analysis.siteOverview}\n\nTarget Audience: ${analysis.targetAudience}\nBusiness Model: ${analysis.businessModel}\n\n## Core Offerings\n${analysis.coreOfferings.map(o => `- ${o}`).join('\n')}\n\n## Tech Stack Indicators\n${analysis.techStackIndicators.map(t => `- ${t}`).join('\n')}\n\n## Strategic Verdict\n${analysis.strategicVerdict}`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-100 border-emerald-300';
    if (score >= 60) return 'text-[#D97757] bg-[#D97757]/15 border-[#D97757]/30';
    return 'text-amber-700 bg-amber-100 border-amber-300';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1B2A32]/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#D97757]/10 text-[#D97757]">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1B2A32]">
              Web & Activity Intelligence Audit
            </h1>
            <p className="text-xs text-[#1B2A32]/60">
              Scrape live website architecture, digital footprint, and value mechanics to generate deep AI strategic audits
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-[#1B2A32]/10 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70 block mb-1">
                Target Website URL
              </label>
              <div className="relative">
                <Globe2 className="w-4 h-4 text-[#1B2A32]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#1B2A32]/15 bg-[#FAF7F0]/50 text-xs text-[#1B2A32] placeholder:text-[#1B2A32]/40 focus:outline-none focus:ring-2 focus:ring-[#D97757]/50"
                />
              </div>
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
              onClick={() => handleAnalyze()}
              disabled={isLoading || !url.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D97757] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#c26547] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scraping & Performing AI Audit...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Web Intelligence Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#1B2A32]/10 space-y-2">
            <span className="text-[10px] font-mono uppercase font-semibold text-[#1B2A32]/50">
              Sample Web Destinations
            </span>
            <div className="grid grid-cols-2 gap-2">
              {sampleUrls.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUrl(s.url);
                    handleAnalyze(s.url);
                  }}
                  className="p-2.5 rounded-xl border border-[#1B2A32]/10 hover:border-[#D97757]/40 bg-white hover:bg-[#D97757]/5 text-left text-xs transition-all group"
                >
                  <span className="font-semibold text-[#1B2A32] block group-hover:text-[#D97757]">
                    {s.label}
                  </span>
                  <span className="text-[10px] text-[#1B2A32]/40 truncate block">
                    {s.url.replace('https://', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Scraped Page Footprint */}
          {pageMeta && (
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#1B2A32]/10 space-y-2 text-xs">
              <span className="text-[10px] font-mono uppercase font-semibold text-[#1B2A32]/50 block">
                Live Scraped Page Metadata
              </span>
              <p className="font-semibold text-[#1B2A32] truncate">
                {pageMeta.title}
              </p>
              {pageMeta.metaDescription && (
                <p className="text-[11px] text-[#1B2A32]/60 line-clamp-2">
                  {pageMeta.metaDescription}
                </p>
              )}
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[#1B2A32]/50">
                <span>{pageMeta.headingCount} Headings</span>
                <span>•</span>
                <span>{(pageMeta.textSampleLength / 1024).toFixed(1)} KB Extracted</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 space-y-6">
          {analysis ? (
            <div className="p-6 rounded-2xl bg-white border border-[#1B2A32]/10 shadow-sm space-y-6">
              {/* Header with Vitality Gauge */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1B2A32]/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-serif font-bold text-[#1B2A32]">
                      Web Intelligence Report
                    </h2>
                    <a
                      href={analysis.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#D97757] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <span className="text-xs font-mono text-[#1B2A32]/50 block truncate max-w-md">
                    {analysis.url}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Activity Score Gauge */}
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${getScoreColor(analysis.activityScore)}`}>
                    <Flame className="w-4 h-4" />
                    <div>
                      <span className="text-[9px] font-mono uppercase block leading-none font-bold">VITALITY</span>
                      <span className="text-sm font-bold font-mono">{analysis.activityScore}/100</span>
                    </div>
                  </div>

                  <button
                    onClick={copyReport}
                    className="p-2 rounded-lg border border-[#1B2A32]/15 text-[#1B2A32]/60 hover:text-[#D97757] flex items-center gap-1 text-xs transition-colors"
                    title="Copy full audit report"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Overview & Audience */}
              <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#1B2A32]/10 space-y-3">
                <div>
                  <span className="text-[10px] font-mono uppercase font-semibold text-[#1B2A32]/50 block">
                    Executive Strategic Summary
                  </span>
                  <p className="text-xs text-[#1B2A32]/85 leading-relaxed mt-1">
                    {analysis.siteOverview}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1B2A32]/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-semibold text-[#1B2A32]/50 flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#D97757]" />
                      Target Persona
                    </span>
                    <p className="text-xs font-medium text-[#1B2A32] mt-0.5">
                      {analysis.targetAudience}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-semibold text-[#1B2A32]/50 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-[#D97757]" />
                      Business Model
                    </span>
                    <p className="text-xs font-medium text-[#1B2A32] mt-0.5">
                      {analysis.businessModel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Offerings */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#D97757]" />
                  Core Product Capabilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysis.coreOfferings.map((offering, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[#1B2A32]/10 bg-white text-xs text-[#1B2A32]/80 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#D97757] flex-shrink-0 mt-0.5" />
                      <span>{offering}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack Indicators */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#D97757]" />
                  Inferred Tech Stack & Architecture
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.techStackIndicators.map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#2B3A4A]/5 border border-[#2B3A4A]/15 text-[#2B3A4A] font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths & Vulnerabilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Strategic Strengths
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-950">
                    {analysis.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vulnerabilities */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Risks & Unaddressed Gaps
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-950">
                    {analysis.vulnerabilities.map((vuln, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{vuln}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strategic Verdict */}
              <div className="p-4 rounded-xl bg-[#2B3A4A] text-white space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/60 font-semibold block">
                  AI Strategic Verdict & Trajectory
                </span>
                <p className="text-xs text-white/90 leading-relaxed font-sans">
                  {analysis.strategicVerdict}
                </p>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-white border border-dashed border-[#1B2A32]/20 flex flex-col items-center justify-center text-center space-y-3 min-h-[380px]">
              <div className="p-4 rounded-2xl bg-[#D97757]/10 text-[#D97757]">
                <Globe2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#1B2A32]">
                No Target Website Analyzed
              </h3>
              <p className="text-xs text-[#1B2A32]/60 max-w-sm">
                Provide a website URL on the left or select a sample tech destination to scrape metadata and perform an automated intelligence audit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
