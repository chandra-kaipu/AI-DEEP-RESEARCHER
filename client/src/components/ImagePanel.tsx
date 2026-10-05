import React, { useState } from 'react';
import { Image as ImageIcon, Download, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { ImageGenerationResult } from '../types';

interface ImagePanelProps {
  image: ImageGenerationResult | null;
  topic: string;
  isMissingKey?: boolean;
  onOpenKeysModal: () => void;
}

export const ImagePanel: React.FC<ImagePanelProps> = ({
  image,
  topic,
  isMissingKey = false,
  onOpenKeysModal,
}) => {
  const [showPrompt, setShowPrompt] = useState(false);

  if (isMissingKey) {
    return (
      <div className="bg-paper-surface rounded-2xl border border-dashed border-terracotta/40 p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-terracotta-50 flex items-center justify-center text-terracotta">
          <ImageIcon className="w-6 h-6" />
        </div>
        <h4 className="font-serif text-lg font-bold text-paper-text">
          Generative Illustration Key Required
        </h4>
        <p className="text-sm text-paper-text-dim max-w-md mx-auto">
          Add <code className="bg-paper-surface-2 px-1.5 py-0.5 rounded text-terracotta font-mono">IMAGE_API_KEY</code> (or OpenAI key) to generate real custom editorial illustrations for each research topic.
        </p>
        <button
          onClick={onOpenKeysModal}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-medium hover:bg-terracotta-600 transition"
        >
          Add Image Key
        </button>
      </div>
    );
  }

  if (!image) return null;

  return (
    <div className="bg-paper-surface rounded-2xl border border-paper-line shadow-paper-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-paper-line">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-terracotta" />
          <h3 className="font-serif text-xl font-bold text-paper-text">
            Editorial Visual Concept
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-paper-surface-2 border border-paper-line text-paper-text-dim font-medium">
            {image.provider}
          </span>
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="p-1 rounded-md text-paper-text-dim hover:text-paper-text hover:bg-paper-surface-2 transition"
            title="View generative prompt"
          >
            <Info className="w-4 h-4" />
          </button>
          <a
            href={image.imageUrl}
            download={`research-art-${encodeURIComponent(topic)}.png`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-paper-surface-2 hover:bg-paper-line border border-paper-line text-xs font-medium text-paper-text transition"
          >
            <Download className="w-3.5 h-3.5 text-terracotta" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Prompt Inspector Drawer */}
      {showPrompt && (
        <div className="p-3 bg-paper-surface-2 rounded-xl border border-paper-line text-xs space-y-1 text-paper-text animate-in fade-in">
          <span className="font-bold text-terracotta">Synthesized Art Prompt:</span>
          <p className="text-paper-text-dim font-serif italic">{image.revisedPrompt}</p>
        </div>
      )}

      {/* Image Display */}
      <div className="rounded-xl overflow-hidden border border-paper-line bg-paper-bg max-h-[500px] flex items-center justify-center relative group">
        <img
          src={image.imageUrl}
          alt={`AI conceptual illustration of ${topic}`}
          className="w-full h-auto object-cover max-h-[500px] transition duration-300 group-hover:scale-[1.01]"
        />
      </div>
    </div>
  );
};
