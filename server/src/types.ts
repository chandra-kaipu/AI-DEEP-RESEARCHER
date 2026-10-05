export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  score?: number;
  publishedDate?: string;
  domain?: string;
  credibilityType?: 'academic' | 'news' | 'gov' | 'tech' | 'blog' | 'general';
}

export interface ExtractedSource extends SearchResultItem {
  fullText?: string;
  author?: string;
  wordCount?: number;
  outboundLinks?: RelatedLink[];
}

export interface RelatedLink {
  title: string;
  url: string;
  domain: string;
  contextText?: string;
}

export interface SubtopicMomentum {
  name: string;
  momentumScore: number; // 0 to 100
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1.0 to 1.0
  stage: 'emerging' | 'accelerating' | 'maturing' | 'declining';
  keyDrivers: string[];
  sourceUrls: string[];
}

export interface TimeSeriesPoint {
  period: string; // e.g., '2022', '2023', '2024', '2025', '2026' or 'Q1', 'Q2', etc.
  mentions: number;
  sentiment: number;
}

export interface TrendAnalysisResult {
  overview: string;
  subtopics: SubtopicMomentum[];
  timeline: TimeSeriesPoint[];
  emergingThemes: string[];
  decliningThemes: string[];
  riskFactors: string[];
  unresolvedDebates: string[];
}

export interface SummaryResult {
  topic: string;
  language: string;
  executiveSummary: string;
  detailedSections: {
    heading: string;
    content: string;
    citations: string[];
  }[];
  summary_basic: string; // ELI5 / simple terms version
  takeaways: string[];
}

export interface MindmapNode {
  id: string;
  label: string;
  type?: 'root' | 'category' | 'detail' | 'insight';
  color?: string;
  children?: MindmapNode[];
  summarySnippet?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  revisedPrompt: string;
  provider: string;
}

export interface ResearchSession {
  id: string;
  topic: string;
  depth: 'quick' | 'deep';
  language: string;
  createdAt: string;
  sources: ExtractedSource[];
  relatedUrls: RelatedLink[];
  analysis: TrendAnalysisResult;
  summary: SummaryResult;
  mindmap: MindmapNode;
  image?: ImageGenerationResult;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: { url: string; title: string; snippet: string }[];
}

export interface KeyStatus {
  searchKeySet: boolean;
  searchProvider: string;
  llmKeySet: boolean;
  llmProvider: string;
  imageKeySet: boolean;
  imageProvider: string;
  ttsKeySet: boolean;
}

export interface TextExplanationResult {
  title: string;
  summary: string;
  intuitiveAnalogy: {
    analogy: string;
    explanation: string;
  };
  coreMechanisms: {
    step: number;
    title: string;
    description: string;
  }[];
  technicalGlossary: {
    term: string;
    plainEnglish: string;
  }[];
  assumptionsAndCaveats: string[];
  practicalExample: {
    scenario: string;
    outcome: string;
  };
  keyTakeaways: string[];
}

export interface FileChartResult {
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'radar';
  title: string;
  subtitle: string;
  xAxisKey: string;
  yAxisKeys: { key: string; color: string; label: string }[];
  data: Record<string, any>[];
  insights: string[];
  summaryStats: {
    totalRows: number;
    visualizedMetrics: string[];
    observation: string;
  };
  alternativeChartTypes: string[];
}

export interface WebAnalysisResult {
  url: string;
  siteOverview: string;
  targetAudience: string;
  activityScore: number;
  businessModel: string;
  coreOfferings: string[];
  techStackIndicators: string[];
  strengths: string[];
  vulnerabilities: string[];
  strategicVerdict: string;
}

