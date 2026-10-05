import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
} from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Layers, Clock, Filter, AlertTriangle } from 'lucide-react';
import { TrendAnalysisResult } from '../types';

interface TrendChartProps {
  analysis: TrendAnalysisResult | null;
  onSelectSubtopic?: (subtopicName: string | null) => void;
  selectedSubtopic?: string | null;
  isMissingKey?: boolean;
  onOpenKeysModal: () => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  analysis,
  onSelectSubtopic,
  selectedSubtopic,
  isMissingKey = false,
  onOpenKeysModal,
}) => {
  const [activeTab, setActiveTab] = useState<'momentum' | 'timeline'>('momentum');

  if (isMissingKey) {
    return (
      <div className="bg-paper-surface rounded-2xl border border-dashed border-terracotta/40 p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-terracotta-50 flex items-center justify-center text-terracotta">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h4 className="font-serif text-lg font-bold text-paper-text">
          Trend Intelligence Key Required
        </h4>
        <p className="text-sm text-paper-text-dim max-w-md mx-auto">
          Add <code className="bg-paper-surface-2 px-1.5 py-0.5 rounded text-terracotta font-mono">LLM_API_KEY</code> to enable quantitative momentum scoring and timeline modeling.
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

  if (!analysis || !analysis.subtopics || analysis.subtopics.length === 0) {
    return null;
  }

  const chartData = analysis.subtopics.map((s) => ({
    name: s.name,
    momentum: s.momentumScore,
    sentiment: s.sentimentScore,
    stage: s.stage,
  }));

  const timelineData = analysis.timeline || [];

  return (
    <div className="bg-paper-surface rounded-2xl border border-paper-line shadow-paper-sm p-6 space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-paper-line">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-terracotta" />
            <h3 className="font-serif text-xl font-bold text-paper-text">
              Trend Momentum & Analytics
            </h3>
          </div>
          <p className="text-xs text-paper-text-dim mt-0.5">
            Derived from live extracted source evidence &bull; Click any bar to isolate sources
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedSubtopic && (
            <button
              onClick={() => onSelectSubtopic?.(null)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-terracotta-50 text-terracotta text-xs border border-terracotta-200"
            >
              <Filter className="w-3 h-3" />
              <span>Reset Filter ({selectedSubtopic})</span>
            </button>
          )}

          <div className="flex items-center bg-paper-surface-2 p-0.5 rounded-lg border border-paper-line text-xs">
            <button
              onClick={() => setActiveTab('momentum')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'momentum'
                  ? 'bg-paper-surface text-terracotta shadow-xs font-semibold'
                  : 'text-paper-text-dim hover:text-paper-text'
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1" />
              Subtopic Momentum
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'timeline'
                  ? 'bg-paper-surface text-terracotta shadow-xs font-semibold'
                  : 'text-paper-text-dim hover:text-paper-text'
              }`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Rendering */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {activeTab === 'momentum' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
                stroke="var(--line)"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: 'var(--text)', fontSize: 11 }}
                stroke="var(--line)"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-paper-surface p-3 rounded-xl border border-paper-line shadow-paper-md text-xs space-y-1">
                        <div className="font-bold text-paper-text">{data.name}</div>
                        <div className="text-terracotta font-semibold">
                          Momentum Score: {data.momentum}/100
                        </div>
                        <div className="text-paper-text-dim capitalize">
                          Maturity Stage: {data.stage}
                        </div>
                        <div className="text-[10px] text-paper-text-dim italic mt-1">
                          Click to filter connected sources
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="momentum"
                radius={[0, 6, 6, 0]}
                cursor="pointer"
                onClick={(entry) => {
                  if (onSelectSubtopic) {
                    onSelectSubtopic(selectedSubtopic === entry.name ? null : entry.name);
                  }
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      selectedSubtopic === entry.name
                        ? '#D97757'
                        : selectedSubtopic
                        ? '#ECE6D8'
                        : index % 2 === 0
                        ? '#D97757'
                        : '#8C9C7C'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97757" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D97757" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="period" stroke="var(--line)" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
              <YAxis stroke="var(--line)" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-paper-surface p-3 rounded-xl border border-paper-line shadow-paper-md text-xs space-y-1">
                        <div className="font-bold text-paper-text">{data.period}</div>
                        <div className="text-terracotta font-semibold">
                          Research Mentions: {data.mentions}
                        </div>
                        <div className="text-sage font-medium">
                          Sentiment Index: {(data.sentiment * 100).toFixed(0)}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="mentions"
                stroke="#D97757"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMentions)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Thematic Vectors: Emerging vs Declining */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Emerging Themes */}
        <div className="p-4 bg-paper-surface-2/40 rounded-xl border border-paper-line space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-sage uppercase tracking-wider">
            <ArrowUpRight className="w-4 h-4 text-sage" />
            <span>Emerging Catalysts & Themes</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.emergingThemes.map((theme, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-paper-surface text-xs font-medium text-paper-text border border-paper-line"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Declining / Headwinds */}
        <div className="p-4 bg-paper-surface-2/40 rounded-xl border border-paper-line space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-terracotta uppercase tracking-wider">
            <ArrowDownRight className="w-4 h-4 text-terracotta" />
            <span>Fading Narratives & Headwinds</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.decliningThemes.map((theme, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-paper-surface text-xs font-medium text-paper-text border border-paper-line"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
