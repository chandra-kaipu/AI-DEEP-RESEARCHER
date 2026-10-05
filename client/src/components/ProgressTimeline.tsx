import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { ProgressState } from '../types';

interface ProgressTimelineProps {
  progress: ProgressState;
  onCancel?: () => void;
}

const STAGES = [
  { key: 'searching', label: 'Web Retrieval', desc: 'Querying live sources' },
  { key: 'extracting', label: 'Extraction', desc: 'Parsing DOM & outbound links' },
  { key: 'analyzing', label: 'Trend Analysis', desc: 'Quantifying subtopic momentum' },
  { key: 'summarizing', label: 'Synthesis', desc: 'Generating paper & ELI5' },
  { key: 'mindmap', label: 'Mindmap', desc: 'Building semantic node tree' },
  { key: 'image', label: 'Generative Art', desc: 'Rendering editorial concept' },
];

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ progress, onCancel }) => {
  if (progress.stage === 'idle') return null;

  const currentIdx = STAGES.findIndex((s) => s.key === progress.stage);
  const isComplete = progress.stage === 'complete';
  const isError = progress.stage === 'error';

  return (
    <div className="w-full max-w-4xl mx-auto my-4 px-4 animate-in fade-in duration-300">
      <div className="bg-paper-surface rounded-xl border border-paper-line shadow-paper-sm p-4">
        {/* Status message header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-paper-line/60">
          <div className="flex items-center space-x-2">
            {!isComplete && !isError && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-terracotta"></span>
              </span>
            )}
            {isComplete && <CheckCircle2 className="w-4 h-4 text-sage" />}
            {isError && <AlertCircle className="w-4 h-4 text-terracotta" />}
            <span className="text-sm font-medium text-paper-text">
              {progress.message || 'Processing research pipeline...'}
            </span>
          </div>

          {!isComplete && onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-paper-text-dim hover:text-terracotta transition underline"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Multi-step progress bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {STAGES.map((stg, idx) => {
            const stepCompleted = isComplete || (currentIdx > idx && currentIdx !== -1);
            const stepActive = !isComplete && currentIdx === idx;

            return (
              <div
                key={stg.key}
                className={`p-2 rounded-lg border text-xs transition ${
                  stepActive
                    ? 'border-terracotta bg-terracotta-50/50 shadow-xs'
                    : stepCompleted
                    ? 'border-sage/40 bg-paper-surface-2/60 text-paper-text'
                    : 'border-paper-line/50 text-paper-text-dim/60 bg-paper-surface'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-medium mb-0.5">
                  {stepCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage shrink-0" />
                  ) : stepActive ? (
                    <Loader2 className="w-3.5 h-3.5 text-terracotta animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-paper-text-dim/40 shrink-0" />
                  )}
                  <span className={stepActive ? 'text-terracotta font-semibold' : ''}>
                    {stg.label}
                  </span>
                </div>
                <div className="text-[10px] text-paper-text-dim truncate">
                  {stg.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
