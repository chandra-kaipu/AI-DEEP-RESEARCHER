import React, { useState } from 'react';
import {
  ExternalLink,
  BookOpen,
  Link2,
  FileCheck,
  Building,
  GraduationCap,
  Newspaper,
  Terminal,
  Globe,
  Copy,
  Check,
  X,
  Quote,
} from 'lucide-react';
import { ExtractedSource, RelatedLink } from '../types';

interface SourceListProps {
  sources: ExtractedSource[];
  relatedUrls: RelatedLink[];
  selectedSubtopic?: string | null;
  onClearFilter?: () => void;
  isMissingKey?: boolean;
  onOpenKeysModal: () => void;
}

export const SourceList: React.FC<SourceListProps> = ({
  sources,
  relatedUrls,
  selectedSubtopic,
  onClearFilter,
  isMissingKey = false,
  onOpenKeysModal,
}) => {
  const [citationModalSource, setCitationModalSource] = useState<ExtractedSource | null>(null);
  const [copiedCitation, setCopiedCitation] = useState<'apa' | 'mla' | null>(null);
  const [activeTab, setActiveTab] = useState<'primary' | 'miscellaneous'>('primary');

  const getCredibilityBadge = (type?: string) => {
    switch (type) {
      case 'academic':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <GraduationCap className="w-3 h-3" />
            <span>Academic / Peer</span>
          </span>
        );
      case 'gov':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Building className="w-3 h-3" />
            <span>Government</span>
          </span>
        );
      case 'news':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Newspaper className="w-3 h-3" />
            <span>Major News</span>
          </span>
        );
      case 'tech':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Terminal className="w-3 h-3" />
            <span>Tech Industry</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-paper-surface-2 text-paper-text-dim border border-paper-line">
            <Globe className="w-3 h-3" />
            <span>General Web</span>
          </span>
        );
    }
  };

  const getApaCitation = (source: ExtractedSource) => {
    const year = source.publishedDate ? new Date(source.publishedDate).getFullYear() : 'n.d.';
    return `${source.author || source.domain || 'Author'}. (${year}). ${source.title}. Retrieved from ${source.url}`;
  };

  const getMlaCitation = (source: ExtractedSource) => {
    return `"${source.title}." ${source.domain || 'Web'}, ${source.publishedDate || 'n.d.'}, ${source.url}.`;
  };

  const copyToClipboard = (text: string, type: 'apa' | 'mla') => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(type);
    setTimeout(() => setCopiedCitation(null), 2000);
  };

  if (isMissingKey) {
    return (
      <div className="bg-paper-surface rounded-2xl border border-dashed border-terracotta/40 p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-terracotta-50 flex items-center justify-center text-terracotta">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="font-serif text-lg font-bold text-paper-text">
          Web Retrieval Key Required
        </h4>
        <p className="text-sm text-paper-text-dim max-w-md mx-auto">
          Add <code className="bg-paper-surface-2 px-1.5 py-0.5 rounded text-terracotta font-mono">SEARCH_API_KEY</code> (Tavily, SerpAPI, or Bing) to execute live web queries and discover secondary links.
        </p>
        <button
          onClick={onOpenKeysModal}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-medium hover:bg-terracotta-600 transition"
        >
          Add Search Key
        </button>
      </div>
    );
  }

  if (sources.length === 0 && relatedUrls.length === 0) return null;

  return (
    <div className="bg-paper-surface rounded-2xl border border-paper-line shadow-paper-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-line">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-terracotta" />
            <h3 className="font-serif text-xl font-bold text-paper-text">
              Sources & Outbound Discovery
            </h3>
          </div>
          <p className="text-xs text-paper-text-dim mt-0.5">
            {sources.length} direct sources analyzed &bull; {relatedUrls.length} secondary miscellaneous URLs mapped
          </p>
        </div>

        {/* Tab switch: Direct Sources vs Miscellaneous URLs */}
        <div className="flex items-center bg-paper-surface-2 p-0.5 rounded-lg border border-paper-line text-xs">
          <button
            onClick={() => setActiveTab('primary')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              activeTab === 'primary'
                ? 'bg-paper-surface text-terracotta shadow-xs font-semibold'
                : 'text-paper-text-dim hover:text-paper-text'
            }`}
          >
            Direct Sources ({sources.length})
          </button>
          <button
            onClick={() => setActiveTab('miscellaneous')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md transition font-medium ${
              activeTab === 'miscellaneous'
                ? 'bg-paper-surface text-terracotta shadow-xs font-semibold'
                : 'text-paper-text-dim hover:text-paper-text'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-dusty" />
            <span>Miscellaneous URLs ({relatedUrls.length})</span>
          </button>
        </div>
      </div>

      {/* Selected subtopic banner */}
      {selectedSubtopic && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-terracotta-50 rounded-lg border border-terracotta-200 text-xs text-terracotta">
          <span>Filtering by Subtopic: <strong>{selectedSubtopic}</strong></span>
          <button onClick={onClearFilter} className="hover:underline font-semibold flex items-center">
            <X className="w-3.5 h-3.5 mr-0.5" /> Clear Filter
          </button>
        </div>
      )}

      {/* Primary Sources List */}
      {activeTab === 'primary' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-4 bg-paper-surface-2/40 hover:bg-paper-surface-2 rounded-xl border border-paper-line transition flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {getCredibilityBadge(src.credibilityType)}
                  <span className="text-[11px] text-paper-text-dim truncate font-mono">
                    {src.domain}
                  </span>
                </div>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-serif font-bold text-sm sm:text-base text-paper-text group-hover:text-terracotta transition line-clamp-2"
                >
                  {src.title}
                </a>

                <p className="text-xs text-paper-text-dim line-clamp-3 leading-relaxed">
                  {src.snippet}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-paper-line/50 text-[11px]">
                <button
                  onClick={() => setCitationModalSource(src)}
                  className="flex items-center space-x-1 text-dusty hover:text-terracotta transition font-medium"
                >
                  <Quote className="w-3.5 h-3.5" />
                  <span>Cite</span>
                </button>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-paper-text-dim hover:text-terracotta transition font-medium"
                >
                  <span>Visit Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Ranked Miscellaneous & Secondary Outbound URLs */
        <div className="space-y-3">
          <div className="text-xs text-paper-text-dim p-3 bg-paper-surface-2 rounded-xl border border-paper-line">
            These secondary links were discovered through DOM parsing of fetched research pages via <strong>Cheerio</strong>. They surface adjacent references, methodologies, and deep citations outside primary search rankings.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedUrls.map((rel, rIdx) => (
              <a
                key={rIdx}
                href={rel.url}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-paper-surface-2/40 hover:bg-paper-surface-2 rounded-xl border border-paper-line transition flex flex-col justify-between group space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-paper-text-dim">
                  <span className="font-mono text-dusty truncate max-w-[140px]">{rel.domain}</span>
                  <ExternalLink className="w-3 h-3 text-paper-text-dim group-hover:text-terracotta" />
                </div>
                <div className="text-xs font-medium text-paper-text group-hover:text-terracotta transition line-clamp-2">
                  {rel.title || rel.domain}
                </div>
                {rel.contextText && (
                  <p className="text-[10px] text-paper-text-dim italic line-clamp-2">
                    &ldquo;{rel.contextText}&rdquo;
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Citation Modal */}
      {citationModalSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-text/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-paper-surface w-full max-w-lg rounded-2xl border border-paper-line shadow-paper-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-paper-line">
              <div className="flex items-center space-x-2">
                <Quote className="w-5 h-5 text-terracotta" />
                <h4 className="font-serif font-bold text-lg text-paper-text">Source Citation</h4>
              </div>
              <button
                onClick={() => setCitationModalSource(null)}
                className="p-1 rounded-md hover:bg-paper-surface-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* APA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-paper-text">
                <span>APA Style (7th Edition)</span>
                <button
                  onClick={() => copyToClipboard(getApaCitation(citationModalSource), 'apa')}
                  className="flex items-center space-x-1 text-terracotta hover:underline"
                >
                  {copiedCitation === 'apa' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCitation === 'apa' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-paper-surface-2 rounded-xl text-xs font-serif text-paper-text border border-paper-line">
                {getApaCitation(citationModalSource)}
              </div>
            </div>

            {/* MLA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-paper-text">
                <span>MLA Style (9th Edition)</span>
                <button
                  onClick={() => copyToClipboard(getMlaCitation(citationModalSource), 'mla')}
                  className="flex items-center space-x-1 text-terracotta hover:underline"
                >
                  {copiedCitation === 'mla' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCitation === 'mla' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-paper-surface-2 rounded-xl text-xs font-serif text-paper-text border border-paper-line">
                {getMlaCitation(citationModalSource)}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setCitationModalSource(null)}
                className="px-4 py-1.5 rounded-lg bg-paper-surface-2 border border-paper-line text-xs font-medium text-paper-text hover:bg-paper-line"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
