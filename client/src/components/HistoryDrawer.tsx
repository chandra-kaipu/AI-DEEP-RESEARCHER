import React, { useEffect, useState } from 'react';
import { X, History, Trash2, ArrowUpRight, BookOpen, Clock, ShieldCheck } from 'lucide-react';
import { ResearchSession, ParentalControlConfig } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: ResearchSession) => void;
  parentalConfig?: ParentalControlConfig;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  parentalConfig,
}) => {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem('ai_deep_researcher_history');
        if (raw) {
          setSessions(JSON.parse(raw));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    localStorage.setItem('ai_deep_researcher_history', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setSessions([]);
    localStorage.removeItem('ai_deep_researcher_history');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-paper-text/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-paper-surface w-full max-w-md h-full shadow-paper-lg border-l border-paper-line flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-paper-line flex items-center justify-between bg-paper-surface-2/40">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-terracotta" />
            <h3 className="font-serif text-lg font-bold text-paper-text">Research Library</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-paper-surface-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parental SafeGuard Protection Banner */}
        {parentalConfig?.enabled && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block text-[11px] text-paper-text">Parental SafeGuard Active</span>
              <p className="text-[10px] text-paper-text-dim leading-snug">
                Clearing this library only removes your saved session cards. All underlying web searches remain permanently recorded in the PIN-protected Parent Ledger.
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-16 text-paper-text-dim text-xs space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-paper-text-dim/50" />
              <p className="font-medium text-sm text-paper-text">No Research Sessions Saved</p>
              <p>Completed research investigations will automatically be saved to your local library.</p>
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess);
                  onClose();
                }}
                className="p-3.5 bg-paper-surface-2/40 hover:bg-paper-surface-2 rounded-xl border border-paper-line hover:border-terracotta cursor-pointer transition space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-paper-text group-hover:text-terracotta transition line-clamp-1">
                    {sess.topic}
                  </span>
                  <button
                    onClick={(e) => handleDelete(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-terracotta transition"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-paper-text-dim">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                  </span>
                  <span className="capitalize px-1.5 py-0.5 rounded bg-paper-surface border border-paper-line text-[10px]">
                    {sess.depth} ({sess.sources?.length || 0} sources)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="p-4 border-t border-paper-line bg-paper-surface-2/30 flex items-center justify-between">
            <span className="text-xs text-paper-text-dim">{sessions.length} sessions stored</span>
            <button
              onClick={handleClearAll}
              title="Clears local view cards only (search history remains archived in Parental Control)"
              className="text-xs text-terracotta hover:underline font-medium"
            >
              Clear Library View
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
