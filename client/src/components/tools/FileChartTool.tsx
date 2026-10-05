import React, { useState, useRef } from 'react';
import {
  Upload,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Layers,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  Info,
  TrendingUp,
  Table as TableIcon,
  CheckCircle2,
  FileText,
  Key,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { FileChartResult } from '../../types';
import { getStoredApiKeys } from '../../utils/keys';

interface ParsedMeta {
  fileName: string;
  fileType: string;
  rowCount: number;
  columns: string[];
  columnTypes: Record<string, string>;
  numericSummary: Record<string, any>;
}

interface FileChartToolProps {
  onOpenKeysModal?: () => void;
}

export const FileChartTool: React.FC<FileChartToolProps> = ({ onOpenKeysModal }) => {
  const [file, setFile] = useState<File | null>(null);
  const [chartGoal, setChartGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ParsedMeta | null>(null);
  const [chartResult, setChartResult] = useState<FileChartResult | null>(null);
  const [activeChartType, setActiveChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');
  const [showDataTable, setShowDataTable] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const palette = ['#D97757', '#2B3A4A', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setChartResult(null);
    setMeta(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const loadDemoData = () => {
    const csvContent = `Region,Category,SubCategory,Sales,Profit,Quantity,Discount
West,Technology,Phones,32000,8400,240,0.1
West,Furniture,Chairs,28500,4200,190,0.15
East,Technology,Accessories,29800,6100,210,0.05
East,Office Supplies,Storage,22400,3800,165,0.2
Central,Technology,Machines,19500,2400,120,0.25
Central,Furniture,Bookcases,14800,-1200,95,0.3
South,Technology,Copiers,18200,5300,85,0.1
South,Office Supplies,Binders,12600,2900,140,0.15
West,Office Supplies,Paper,11200,4100,280,0.05
East,Furniture,Tables,16900,-850,70,0.35`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const demoFile = new File([blob], 'Sample_Superstore.csv', { type: 'text/csv' });
    handleFileSelect(demoFile);
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) {
      setError('Please select or drop a data file first.');
      return;
    }

    const { llmKey, llmProvider } = getStoredApiKeys();
    if (!llmKey) {
      setError('MISSING_KEY:LLM_API_KEY: Please set your Google Gemini or LLM API key via the "API Setup" modal in the top navigation.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (chartGoal.trim()) {
        formData.append('chartGoal', chartGoal.trim());
      }

      formData.append('customKey', llmKey);
      if (llmProvider) {
        formData.append('customProvider', llmProvider);
      }

      const res = await fetch('/api/tools/file-chart', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setMeta(data.fileData);
      setChartResult(data.chartResult);
      setActiveChartType(data.chartResult.chartType || 'bar');
    } catch (err: any) {
      console.error('File chart generation failed:', err);
      setError(err.message || 'Failed to analyze file and build chart.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderActiveChart = () => {
    if (!chartResult || !chartResult.data || chartResult.data.length === 0) return null;

    const data = chartResult.data;
    const xKey = chartResult.xAxisKey;
    const yKeys = chartResult.yAxisKeys || [];

    // Fallback if no yKeys
    const keysToPlot = yKeys.length > 0 ? yKeys : [{ key: 'value', color: '#D97757', label: 'Metric' }];

    switch (activeChartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2A32" strokeOpacity={0.08} />
              <XAxis dataKey={xKey} stroke="#1B2A32" opacity={0.6} tick={{ fontSize: 11 }} />
              <YAxis stroke="#1B2A32" opacity={0.6} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF7F0',
                  borderRadius: '12px',
                  border: '1px solid rgba(27,42,50,0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {keysToPlot.map((yk, idx) => (
                <Line
                  key={yk.key}
                  type="monotone"
                  dataKey={yk.key}
                  name={yk.label}
                  stroke={yk.color || palette[idx % palette.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2A32" strokeOpacity={0.08} />
              <XAxis dataKey={xKey} stroke="#1B2A32" opacity={0.6} tick={{ fontSize: 11 }} />
              <YAxis stroke="#1B2A32" opacity={0.6} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF7F0',
                  borderRadius: '12px',
                  border: '1px solid rgba(27,42,50,0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {keysToPlot.map((yk, idx) => (
                <Area
                  key={yk.key}
                  type="monotone"
                  dataKey={yk.key}
                  name={yk.label}
                  stroke={yk.color || palette[idx % palette.length]}
                  fill={yk.color || palette[idx % palette.length]}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const primaryMetric = keysToPlot[0]?.key || Object.keys(data[0] || {})[1];
        return (
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF7F0',
                  borderRadius: '12px',
                  border: '1px solid rgba(27,42,50,0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Pie
                data={data}
                dataKey={primaryMetric}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={50}
                paddingAngle={3}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2A32" strokeOpacity={0.08} />
              <XAxis dataKey={xKey} stroke="#1B2A32" opacity={0.6} tick={{ fontSize: 11 }} />
              <YAxis stroke="#1B2A32" opacity={0.6} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF7F0',
                  borderRadius: '12px',
                  border: '1px solid rgba(27,42,50,0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {keysToPlot.map((yk, idx) => (
                <Bar
                  key={yk.key}
                  dataKey={yk.key}
                  name={yk.label}
                  fill={yk.color || palette[idx % palette.length]}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1B2A32]/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#D97757]/10 text-[#D97757]">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1B2A32]">
              Universal File-to-Chart Visualizer
            </h1>
            <p className="text-xs text-[#1B2A32]/60">
              Upload Excel spreadsheets (.xlsx, .xls), CSVs, JSON, or text files to generate publication-grade Recharts visualizations & insights
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Upload & Config Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 bg-white shadow-xs ${
              file
                ? 'border-[#D97757] ring-2 ring-[#D97757]/20'
                : 'border-[#1B2A32]/20 hover:border-[#D97757]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="p-3.5 rounded-xl bg-[#FAF7F0] shadow-xs inline-block text-[#D97757]">
              {file ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : <Upload className="w-7 h-7" />}
            </div>

            <div>
              <p className="text-sm font-semibold text-[#1B2A32]">
                {file ? file.name : 'Choose or drop your data file'}
              </p>
              <p className="text-xs text-[#1B2A32]/50 mt-1">
                Supports Excel (.xlsx, .xls), CSV, JSON, TXT (up to 25MB)
              </p>
              {file && (
                <span className="inline-block mt-2 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {(file.size / 1024).toFixed(1)} KB ready
                </span>
              )}
            </div>
          </div>

          {/* Quick Demo Sample Loader */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-[#1B2A32]/50 font-mono">No spreadsheet ready?</span>
            <button
              type="button"
              onClick={loadDemoData}
              className="text-xs font-semibold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Load Superstore Sample
            </button>
          </div>

          {/* Goal & Prompt Input */}
          <div className="p-5 rounded-2xl bg-white border border-[#1B2A32]/10 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70 block mb-1">
                Visualization Goal (Optional)
              </label>
              <input
                type="text"
                value={chartGoal}
                onChange={(e) => setChartGoal(e.target.value)}
                placeholder="e.g. Compare regional profit margin, or find top categories..."
                className="w-full p-3 rounded-xl border border-[#1B2A32]/15 bg-[#FAF7F0]/50 text-xs text-[#1B2A32] placeholder:text-[#1B2A32]/40 focus:outline-none focus:ring-2 focus:ring-[#D97757]/50"
              />
              <p className="text-[10px] text-[#1B2A32]/45 mt-1">
                Leave blank to let AI automatically discover the most statistically compelling dimensions.
              </p>
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
              onClick={handleUploadAndAnalyze}
              disabled={isLoading || !file}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D97757] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#c26547] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing Sheet & Synthesizing Chart...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Generate Chart</span>
                </>
              )}
            </button>
          </div>

          {/* Parsed File Meta Summary */}
          {meta && (
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#1B2A32]/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70">
                <FileSpreadsheet className="w-4 h-4 text-[#D97757]" />
                Dataset Architecture
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#1B2A32]/5">
                  <span className="text-[#1B2A32]/50 text-[10px] block font-mono">TOTAL ROWS</span>
                  <span className="font-semibold text-sm">{meta.rowCount.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#1B2A32]/5">
                  <span className="text-[#1B2A32]/50 text-[10px] block font-mono">ATTRIBUTES</span>
                  <span className="font-semibold text-sm">{meta.columns.length}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#1B2A32]/50 uppercase">Detected Columns</span>
                <div className="flex flex-wrap gap-1">
                  {meta.columns.slice(0, 10).map((col) => (
                    <span
                      key={col}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#1B2A32]/10 text-[#1B2A32]/70"
                    >
                      {col} ({meta.columnTypes[col] || 'text'})
                    </span>
                  ))}
                  {meta.columns.length > 10 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-[#1B2A32]/40">
                      +{meta.columns.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Chart & Insights Column */}
        <div className="lg:col-span-7 space-y-6">
          {chartResult ? (
            <div className="p-6 rounded-2xl bg-white border border-[#1B2A32]/10 shadow-sm space-y-6">
              {/* Chart Title & Type Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1B2A32]/10">
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#1B2A32]">
                    {chartResult.title}
                  </h2>
                  <p className="text-xs text-[#1B2A32]/60 mt-0.5">
                    {chartResult.subtitle}
                  </p>
                </div>

                {/* Chart Type Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[#FAF7F0] rounded-xl border border-[#1B2A32]/10 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveChartType('bar')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                      activeChartType === 'bar'
                        ? 'bg-[#D97757] text-white shadow-xs font-medium'
                        : 'text-[#1B2A32]/60 hover:text-[#1B2A32]'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bar</span>
                  </button>
                  <button
                    onClick={() => setActiveChartType('line')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                      activeChartType === 'line'
                        ? 'bg-[#D97757] text-white shadow-xs font-medium'
                        : 'text-[#1B2A32]/60 hover:text-[#1B2A32]'
                    }`}
                  >
                    <LineChartIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Line</span>
                  </button>
                  <button
                    onClick={() => setActiveChartType('area')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                      activeChartType === 'area'
                        ? 'bg-[#D97757] text-white shadow-xs font-medium'
                        : 'text-[#1B2A32]/60 hover:text-[#1B2A32]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Area</span>
                  </button>
                  <button
                    onClick={() => setActiveChartType('pie')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                      activeChartType === 'pie'
                        ? 'bg-[#D97757] text-white shadow-xs font-medium'
                        : 'text-[#1B2A32]/60 hover:text-[#1B2A32]'
                    }`}
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pie</span>
                  </button>
                </div>
              </div>

              {/* The Recharts Graphic Container */}
              <div className="w-full bg-[#FAF7F0]/40 rounded-xl p-4 border border-[#1B2A32]/5">
                {renderActiveChart()}
              </div>

              {/* Insights List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1B2A32]/70 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#D97757]" />
                    Analytical Takeaways
                  </span>
                  <button
                    onClick={() => setShowDataTable(!showDataTable)}
                    className="text-xs text-[#D97757] hover:underline flex items-center gap-1"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    {showDataTable ? 'Hide Data Table' : 'View Data Rows'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {chartResult.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAF7F0] border border-[#1B2A32]/10 text-xs text-[#1B2A32]/80 leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#D97757]/15 text-[#D97757] font-mono text-[10px] flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible Data Table */}
              {showDataTable && (
                <div className="mt-4 border border-[#1B2A32]/10 rounded-xl overflow-hidden text-xs">
                  <div className="max-h-48 overflow-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#FAF7F0] border-b border-[#1B2A32]/10 font-mono text-[10px] uppercase text-[#1B2A32]/60 sticky top-0">
                        <tr>
                          {Object.keys(chartResult.data[0] || {}).map((col) => (
                            <th key={col} className="p-2.5">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1B2A32]/5">
                        {chartResult.data.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF7F0]/50">
                            {Object.keys(row).map((k) => (
                              <td key={k} className="p-2.5 font-mono text-[11px] text-[#1B2A32]/80">
                                {typeof row[k] === 'number' ? row[k].toLocaleString() : String(row[k])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-2xl bg-white border border-dashed border-[#1B2A32]/20 flex flex-col items-center justify-center text-center space-y-3 min-h-[380px]">
              <div className="p-4 rounded-2xl bg-[#D97757]/10 text-[#D97757]">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-serif font-semibold text-[#1B2A32]">
                No Visualization Yet
              </h3>
              <p className="text-xs text-[#1B2A32]/60 max-w-sm">
                Attach an Excel workbook (like Sample Superstore.xlsx), CSV, or JSON data file on the left to extract metrics and generate interactive charts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
