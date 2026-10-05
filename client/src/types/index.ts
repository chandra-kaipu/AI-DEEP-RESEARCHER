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
  period: string;
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
  summary_basic: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: { url: string; title: string; snippet: string }[];
}

export interface ResearchSession {
  id: string;
  topic: string;
  depth: 'quick' | 'deep';
  language: string;
  createdAt: string;
  sources: ExtractedSource[];
  relatedUrls: RelatedLink[];
  analysis?: TrendAnalysisResult;
  summary?: SummaryResult;
  mindmap?: MindmapNode;
  image?: ImageGenerationResult;
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

export interface ProgressState {
  stage: 'idle' | 'searching' | 'extracting' | 'analyzing' | 'summarizing' | 'mindmap' | 'image' | 'complete' | 'error';
  step: number;
  totalSteps: number;
  message: string;
}

export type ActiveToolView = 'research' | 'image-studio' | 'file-chart' | 'text-explainer' | 'web-analyzer' | 'syllabus-hub';

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
export interface ParentalControlConfig {
  enabled: boolean;
  pin: string; // 4-digit PIN
  level: 'strict' | 'moderate' | 'off';
  kidMode: boolean; // Enables kid-friendly suggestions & educational curiosities
  customBlockedKeywords: string[];
  blockMatureImages: boolean;
  safeSearchStrict: boolean;
}

export type FocusSoundType = 'none' | 'brown' | 'pink' | 'white' | 'binaural';

export interface FocusModeState {
  isActive: boolean;
  timerMode: 'work' | 'break';
  workDurationMinutes: number; // default 25
  breakDurationMinutes: number; // default 5
  remainingSeconds: number;
  isRunning: boolean;
  soundType: FocusSoundType;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
}

export interface SavedDossierItem {
  id: string;
  topic: string;
  date: string;
  summarySnippet: string;
  language?: string;
  sourceCount?: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizRecord {
  id: string;
  topic: string;
  date: string;
  score: number;
  total: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  googleId?: string;
  role: 'student' | 'educator' | 'parent';
  gradeLevel: 'middle' | 'high' | 'college' | 'lifelong';
  interests: string[];
  learningStats: {
    topicsExplored: number;
    quizzesPassed: number;
    totalFocusMinutes: number;
  };
  savedDossiers: SavedDossierItem[];
  quizResults: QuizRecord[];
  createdAt: string;
}

export interface UnitMaterial {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  extractedSnippet?: string;
  keyInsights?: string[];
  cloudSynced?: boolean;
}

export interface SyllabusChapter {
  id: string;
  number: number;
  title: string;
  overview: string;
  keyConcepts: string[];
  prerequisites: string[];
  learningObjectives: string[];
  status?: 'not_started' | 'in_progress' | 'mastered';
  uploadedMaterials?: UnitMaterial[];
}

export interface SyllabusCourse {
  id: string;
  subject: string;
  field: string;
  gradeLevel: 'middle' | 'high' | 'college' | 'lifelong';
  chapters: SyllabusChapter[];
}

export interface DbConfig {
  type: 'local' | 'postgres' | 'supabase' | 'mongodb';
  status: 'connected' | 'local_fallback';
  databaseUrl?: string;
  storageProvider?: 'local' | 'google-drive' | 's3';
  storageQuota?: string;
}

export interface ParentalAuditLogEntry {
  id: string;
  topic: string;
  tool: 'deep-research' | 'image-studio' | 'text-explainer' | 'web-analyzer';
  timestamp: string;
  status: 'allowed' | 'intercepted';
  interceptReason?: string;
  category?: string;
}
