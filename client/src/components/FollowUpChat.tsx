import React, { useState } from 'react';
import { MessageSquare, Send, Loader2, Sparkles, ExternalLink, Bot, User } from 'lucide-react';
import { ExtractedSource, ChatMessage } from '../types';

interface FollowUpChatProps {
  topic: string;
  sources: ExtractedSource[];
  isMissingKey?: boolean;
  onOpenKeysModal: () => void;
}

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  topic,
  sources,
  isMissingKey = false,
  onOpenKeysModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          sources,
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate grounded answer.');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `⚠️ Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMissingKey) {
    return (
      <div className="bg-paper-surface rounded-2xl border border-dashed border-terracotta/40 p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-terracotta-50 flex items-center justify-center text-terracotta">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h4 className="font-serif text-lg font-bold text-paper-text">
          Grounded Follow-up Chat Key Required
        </h4>
        <p className="text-sm text-paper-text-dim max-w-md mx-auto">
          Add <code className="bg-paper-surface-2 px-1.5 py-0.5 rounded text-terracotta font-mono">LLM_API_KEY</code> to ask questions strictly grounded in this run’s fetched sources.
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

  if (sources.length === 0) return null;

  return (
    <div className="bg-paper-surface rounded-2xl border border-paper-line shadow-paper-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-paper-line">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-terracotta" />
          <h3 className="font-serif text-xl font-bold text-paper-text">
            Grounded Corpus Q&A (RAG)
          </h3>
        </div>
        <span className="text-xs text-paper-text-dim">
          Responses constrained to {sources.length} fetched sources
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-paper-text-dim text-xs space-y-2">
            <Sparkles className="w-6 h-6 mx-auto text-terracotta/60" />
            <p className="font-serif text-sm text-paper-text font-medium">
              Have specific questions about {topic}?
            </p>
            <p className="max-w-md mx-auto">
              Ask about technical nuances, contradictions among sources, or emerging commercial milestones. Answers are strictly synthesized from the fetched literature.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 text-xs sm:text-sm ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-terracotta text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-terracotta text-white rounded-br-xs'
                    : 'bg-paper-surface-2/60 border border-paper-line text-paper-text rounded-bl-xs'
                }`}
              >
                <div className="leading-relaxed whitespace-pre-line font-sans">
                  {msg.content}
                </div>

                {/* Citations if assistant */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-paper-line/50 space-y-1">
                    <span className="text-[10px] font-semibold text-paper-text-dim block uppercase">
                      Grounding References:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {msg.citations.map((cite, cIdx) => (
                        <a
                          key={cIdx}
                          href={cite.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-paper-surface hover:bg-paper-line text-[11px] text-dusty border border-paper-line truncate max-w-[240px]"
                        >
                          <span className="truncate">{cite.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[10px] text-right ${
                    msg.role === 'user' ? 'text-white/70' : 'text-paper-text-dim'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-paper-surface-2 border border-paper-line text-paper-text flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-paper-text-dim" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-paper-text-dim p-3 bg-paper-surface-2/40 rounded-xl max-w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-terracotta" />
            <span>Consulting fetched research corpus...</span>
          </div>
        )}
      </div>

      {/* Input row */}
      <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask anything grounded in the ${sources.length} sources...`}
          disabled={isLoading}
          className="w-full bg-paper-surface-2 border border-paper-line rounded-xl px-4 py-2.5 text-xs sm:text-sm text-paper-text placeholder:text-paper-text-dim focus:outline-none focus:border-terracotta"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2.5 rounded-xl bg-terracotta hover:bg-terracotta-600 disabled:opacity-50 text-white transition shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
