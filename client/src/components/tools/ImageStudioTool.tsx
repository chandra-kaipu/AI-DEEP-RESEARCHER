import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Wand2,
  ExternalLink,
  Layers,
  ZoomIn,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

import { getStoredApiKeys } from '../../utils/keys';
import { ParentalControlConfig } from '../../types';
import { checkSafety, logParentalSearch } from '../../utils/safety';

interface GeneratedImageItem {
  id: string;
  originalPrompt: string;
  enhancedPrompt: string;
  style: string;
  imageUrl: string;
  timestamp: string;
}

interface ImageStudioToolProps {
  onOpenKeysModal?: () => void;
  parentalConfig?: ParentalControlConfig;
}

export const ImageStudioTool: React.FC<ImageStudioToolProps> = ({ onOpenKeysModal, parentalConfig }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<GeneratedImageItem | null>(null);
  const [history, setHistory] = useState<GeneratedImageItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const stylePresets = [
    { name: 'Cinematic', desc: 'Dramatic lighting, 35mm film feel' },
    { name: 'Photorealistic', desc: '8K studio photography, ultra-crisp' },
    { name: 'Digital Art', desc: 'Modern concept art, artstation trending' },
    { name: 'Isometric 3D', desc: 'Clean low-poly, tilt-shift miniature' },
    { name: 'Cyberpunk', desc: 'Neon lights, futuristic tech atmosphere' },
    { name: 'Watercolor', desc: 'Fluid ink, textured paper bleed' },
    { name: 'Editorial Ink', desc: 'New Yorker style, intricate hatching' },
  ];

  const samplePrompts = [
    'A retrofuturistic library floating inside a nebula with brass telescopes',
    'An ancient cybernetic tree powering a vertical greenhouse city',
    'A hyperrealistic close-up of a chameleon with kaleidoscopic crystal scales',
    'A quiet rainy coffee shop in Kyoto with neon reflection on wet pavement',
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = (customPrompt || prompt).trim();
    if (!textToUse) {
      setError('Please enter a description or prompt for the image.');
      return;
    }

    if (parentalConfig?.enabled && parentalConfig?.blockMatureImages) {
      const safety = checkSafety(textToUse, parentalConfig);
      if (!safety.isSafe) {
        logParentalSearch({
          topic: textToUse,
          tool: 'image-studio',
          status: 'intercepted',
          interceptReason: safety.reason,
          category: safety.category,
        });
        setError(`SafeGuard Intercept: ${safety.reason || 'This prompt contains restricted keywords.'}`);
        return;
      }
    }

    logParentalSearch({
      topic: textToUse,
      tool: 'image-studio',
      status: 'allowed',
    });

    setIsGenerating(true);
    setError(null);

    try {
      const { llmKey, llmProvider } = getStoredApiKeys();

      const res = await fetch('/api/tools/image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse,
          style: selectedStyle,
          customKey: llmKey || undefined,
          customProvider: llmProvider || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const newItem: GeneratedImageItem = {
        id: Date.now().toString(),
        originalPrompt: data.originalPrompt || textToUse,
        enhancedPrompt: data.enhancedPrompt || textToUse,
        style: data.style || selectedStyle,
        imageUrl: data.imageUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setCurrentImage(newItem);
      setHistory((prev) => [newItem, ...prev]);
    } catch (err: any) {
      console.error('Image generation failed:', err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        const ext = url.includes('image/webp') ? 'webp' : url.includes('image/png') ? 'png' : url.includes('image/svg') ? 'svg' : 'jpg';
        link.download = `${filename.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1B2A32]/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#D97757]/10 text-[#D97757]">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1B2A32]">
              AI Image Studio
            </h1>
            <p className="text-xs text-[#1B2A32]/60">
              Prompt-to-visual engine with automated prompt enhancement and multi-aesthetic rendering
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Prompt Input Box */}
          <div className="p-5 rounded-2xl bg-white border border-[#1B2A32]/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70">
                Your Visual Prompt
              </label>
              <button
                type="button"
                onClick={() => {
                  const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
                  setPrompt(randomPrompt);
                }}
                className="text-[11px] text-[#D97757] hover:underline flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" />
                Inspire Me
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to visualize in vivid detail..."
              rows={4}
              className="w-full p-3.5 rounded-xl border border-[#1B2A32]/15 bg-[#FAF7F0]/50 text-sm text-[#1B2A32] placeholder:text-[#1B2A32]/40 focus:outline-none focus:ring-2 focus:ring-[#D97757]/50 resize-none transition-all"
            />

            {/* Style Selector */}
            <div>
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70 block mb-2">
                Aesthetic Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {stylePresets.map((st) => (
                  <button
                    key={st.name}
                    type="button"
                    onClick={() => setSelectedStyle(st.name)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedStyle === st.name
                        ? 'border-[#D97757] bg-[#D97757]/10 text-[#D97757] font-medium shadow-xs'
                        : 'border-[#1B2A32]/10 hover:border-[#1B2A32]/20 text-[#1B2A32]/70 bg-white'
                    }`}
                  >
                    <div className="text-xs font-semibold">{st.name}</div>
                    <div className="text-[10px] text-[#1B2A32]/50 truncate">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D97757] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#c26547] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing & Rendering...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </div>

          {/* Prompt Inspiration List */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#1B2A32]/10 space-y-2">
            <span className="text-[10px] font-mono uppercase font-semibold text-[#1B2A32]/50">
              Try Sample Prompts
            </span>
            <div className="space-y-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleGenerate(p);
                  }}
                  className="w-full text-left text-xs text-[#1B2A32]/70 hover:text-[#D97757] p-2 rounded-lg hover:bg-white transition-all truncate"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 space-y-6">
          {isGenerating ? (
            <div className="p-8 rounded-2xl bg-white border border-[#1B2A32]/10 shadow-sm space-y-4 flex flex-col items-center justify-center min-h-[460px] text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#D97757]/15 flex items-center justify-center text-[#D97757] animate-pulse">
                  <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <div className="absolute -inset-1 rounded-2xl border-2 border-[#D97757]/30 animate-ping" style={{ animationDuration: '2.5s' }} />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-serif font-bold text-[#1B2A32]">
                  Synthesizing Generative Artwork...
                </h3>
                <p className="text-xs text-[#1B2A32]/60">
                  Executing diffusion steps across GPU cluster. Converting latent vectors into high-resolution visual pixels.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#D97757] bg-[#D97757]/10 px-3 py-1.5 rounded-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Neural rendering in progress (~8-12s)</span>
              </div>
            </div>
          ) : currentImage ? (
            <div className="p-5 rounded-2xl bg-white border border-[#1B2A32]/10 shadow-sm space-y-4">
              {/* Image Preview Card */}
              <div className="relative group rounded-xl overflow-hidden bg-[#1B2A32]/5 border border-[#1B2A32]/10 aspect-square flex items-center justify-center">
                <img
                  src={currentImage.imageUrl}
                  alt="AI Generated Artwork"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('data:image/svg+xml')) {
                      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="%231B2A32"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23D97757" font-family="sans-serif" font-size="20">AI Generated Canvas</text></svg>';
                    }
                  }}
                />

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                  <div className="text-white text-xs max-w-[70%] truncate font-mono">
                    Style: {currentImage.style}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoomOpen(true)}
                      title="Enlarge"
                      className="p-2 rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadImage(currentImage.imageUrl, currentImage.originalPrompt)}
                      title="Download image"
                      className="p-2 rounded-lg bg-[#D97757] text-white hover:bg-[#c26547] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Prompt & Details */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#1B2A32]/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#1B2A32]/60 font-semibold flex items-center gap-1.5">
                    <Wand2 className="w-3 h-3 text-[#D97757]" />
                    AI Enhanced Prompt
                  </span>
                  <button
                    onClick={() => copyPrompt(currentImage.enhancedPrompt)}
                    className="text-[11px] text-[#1B2A32]/60 hover:text-[#D97757] flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-[#1B2A32]/80 leading-relaxed font-sans">
                  {currentImage.enhancedPrompt}
                </p>
              </div>

              {/* Direct Link & Download Bar */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#1B2A32]/40 font-mono">
                  Rendered at {currentImage.timestamp} • 1024x1024
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={currentImage.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-[#1B2A32]/15 text-xs text-[#1B2A32]/70 hover:bg-[#1B2A32]/5 flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Full Size
                  </a>
                  <button
                    onClick={() => downloadImage(currentImage.imageUrl, currentImage.originalPrompt)}
                    className="px-3 py-1.5 rounded-lg bg-[#D97757] text-white text-xs font-medium hover:bg-[#c26547] flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-white border border-dashed border-[#1B2A32]/20 flex flex-col items-center justify-center text-center space-y-3 min-h-[380px]">
              <div className="p-4 rounded-2xl bg-[#D97757]/10 text-[#D97757]">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#1B2A32]">
                Your Studio Canvas is Empty
              </h3>
              <p className="text-xs text-[#1B2A32]/60 max-w-sm">
                Type a prompt on the left or select one of the inspirational samples to start generating high-resolution concept visuals.
              </p>
            </div>
          )}

          {/* Session History Carousel */}
          {history.length > 1 && (
            <div className="p-4 rounded-2xl bg-white border border-[#1B2A32]/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70">
                <Layers className="w-3.5 h-3.5 text-[#D97757]" />
                Session History ({history.length})
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentImage(item)}
                    className={`relative rounded-lg overflow-hidden border aspect-square transition-all ${
                      currentImage?.id === item.id
                        ? 'border-[#D97757] ring-2 ring-[#D97757]/30 scale-95'
                        : 'border-[#1B2A32]/10 hover:border-[#1B2A32]/30'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.originalPrompt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage.imageUrl}
              alt={currentImage.originalPrompt}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="p-3 flex items-center justify-between text-xs">
              <span className="font-mono text-[#1B2A32]/70 truncate max-w-md">
                {currentImage.originalPrompt}
              </span>
              <button
                onClick={() => setZoomOpen(false)}
                className="px-3 py-1 rounded-lg bg-[#1B2A32]/10 hover:bg-[#1B2A32]/20 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
