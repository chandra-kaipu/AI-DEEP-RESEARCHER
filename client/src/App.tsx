import React, { useState, useEffect } from 'react';
import { BackgroundScene } from './components/BackgroundScene';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ProgressTimeline } from './components/ProgressTimeline';
import { SummaryPanel } from './components/SummaryPanel';
import { TrendChart } from './components/TrendChart';
import { Mindmap } from './components/Mindmap';
import { ImagePanel } from './components/ImagePanel';
import { SourceList } from './components/SourceList';
import { FollowUpChat } from './components/FollowUpChat';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CompareModal } from './components/CompareModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ExportModal } from './components/ExportModal';
import { LeftSidebar } from './components/LeftSidebar';
import { ImageStudioTool } from './components/tools/ImageStudioTool';
import { FileChartTool } from './components/tools/FileChartTool';
import { TextExplainerTool } from './components/tools/TextExplainerTool';
import { WebAnalyzerTool } from './components/tools/WebAnalyzerTool';
import { SyllabusTool } from './components/tools/SyllabusTool';
import { ParentalControlModal } from './components/ParentalControlModal';
import { SafeGuardShield } from './components/SafeGuardShield';
import { FocusToolbar } from './components/FocusToolbar';
import { AuthModal } from './components/AuthModal';
import { StudentHubModal } from './components/StudentHubModal';
import { StudentQuizModal } from './components/StudentQuizModal';
import { useResearchStream } from './hooks/useResearchStream';
import { KeyStatus, ResearchSession, ActiveToolView, ParentalControlConfig, FocusModeState, UserProfile } from './types';
import { getStoredApiKeys } from './utils/keys';
import { getStoredParentalConfig, saveParentalConfig, checkSafety, SafetyCheckResult, logParentalSearch } from './utils/safety';
import { getStoredUser, fetchCurrentUser, clearSession, saveDossierToVault, recordFocusTime } from './utils/auth';
import { AlertCircle, Key, FileDown, Sparkles, Trophy, BookmarkPlus, CheckCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('ai_deep_researcher_theme') === 'dark';
  });

  const [activeView, setActiveView] = useState<ActiveToolView>('research');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [keyStatus, setKeyStatus] = useState<KeyStatus | undefined>(undefined);
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);

  // Student Authentication & Knowledge Hub State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getStoredUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isStudentHubOpen, setIsStudentHubOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [vaultSaved, setVaultSaved] = useState(false);
  const [isSavingToVault, setIsSavingToVault] = useState(false);

  // Parental Control SafeGuard State
  const [parentalConfig, setParentalConfig] = useState<ParentalControlConfig>(getStoredParentalConfig);
  const [isParentalModalOpen, setIsParentalModalOpen] = useState(false);
  const [blockedQueryState, setBlockedQueryState] = useState<{
    blockedTopic: string;
    safetyResult: SafetyCheckResult;
  } | null>(null);

  // Zen Focus Mode State
  const [focusState, setFocusState] = useState<FocusModeState>({
    isActive: false,
    timerMode: 'work',
    workDurationMinutes: 25,
    breakDurationMinutes: 5,
    remainingSeconds: 25 * 60,
    isRunning: false,
    soundType: 'none',
    volume: 0.4,
    isMuted: false,
  });

  const {
    isResearching,
    topic,
    sources,
    relatedUrls,
    analysis,
    summary,
    mindmap,
    image,
    missingKeys,
    error,
    progress,
    startResearch,
    cancelResearch,
    loadSession,
  } = useResearchStream();

  // Toggle Theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ai_deep_researcher_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ai_deep_researcher_theme', 'light');
    }
  }, [isDark]);

  // Fetch API Key Status
  const fetchKeyStatus = async () => {
    try {
      const res = await fetch('/api/keys/status');
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data.keys);
      }
    } catch (err) {
      console.error('Could not check key status:', err);
    }
  };

  useEffect(() => {
    const initSavedKeys = async () => {
      try {
        const saved = localStorage.getItem('ai_deep_researcher_keys');
        if (saved) {
          const parsed = JSON.parse(saved);
          await fetch('/api/keys/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          });
        }
      } catch (err) {
        console.error('Error hydrating saved keys:', err);
      }
      fetchKeyStatus();
    };
    initSavedKeys();
    fetchCurrentUser().then((u) => {
      if (u) setCurrentUser(u);
    });
  }, []);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  const handleSaveToVault = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSavingToVault(true);
    try {
      const summaryText = summary?.executiveSummary || summary?.summary_basic || topic;
      const { user: updatedUser } = await saveDossierToVault({
        topic: topic || 'Research Dossier',
        summarySnippet: summaryText,
        language: summary?.language || 'en',
        sourceCount: sources.length,
      });
      setCurrentUser(updatedUser);
      setVaultSaved(true);
      setTimeout(() => setVaultSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Could not save to vault.');
    } finally {
      setIsSavingToVault(false);
    }
  };

  const handleSaveKeys = async (keys: any) => {
    try {
      localStorage.setItem('ai_deep_researcher_keys', JSON.stringify(keys));
    } catch {}
    await fetch('/api/keys/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keys),
    });
    await fetchKeyStatus();
  };

  const toggleFocusMode = () => {
    setFocusState((prev) => {
      const next = !prev.isActive;
      if (next) {
        setIsSidebarCollapsed(true);
      }
      return { ...prev, isActive: next };
    });
  };

  // Keyboard shortcut listener for Zen Focus Mode (Alt+F or Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        toggleFocusMode();
      } else if (e.key === 'Escape' && focusState.isActive) {
        setFocusState((prev) => ({ ...prev, isActive: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusState.isActive]);

  const handleSaveParentalConfig = (newConfig: ParentalControlConfig) => {
    setParentalConfig(newConfig);
    saveParentalConfig(newConfig);
    if (!newConfig.enabled || newConfig.level === 'off') {
      setBlockedQueryState(null);
    }
  };

  const handleStartSearch = async (
    queryTopic: string,
    depth: 'quick' | 'deep',
    lang: string,
    file?: File,
    bypassSafety = false
  ) => {
    setSelectedSubtopic(null);

    // Parental Safety Intercept
    if (!bypassSafety && parentalConfig.enabled && parentalConfig.level !== 'off') {
      const safety = checkSafety(queryTopic, parentalConfig);
      if (!safety.isSafe) {
        logParentalSearch({
          topic: queryTopic,
          tool: 'deep-research',
          status: 'intercepted',
          interceptReason: safety.reason,
          category: safety.category,
        });
        setBlockedQueryState({
          blockedTopic: queryTopic,
          safetyResult: safety,
        });
        return;
      }
    }

    // Always log allowed searches to permanent parental audit ledger
    logParentalSearch({
      topic: queryTopic,
      tool: 'deep-research',
      status: 'allowed',
      interceptReason: bypassSafety ? 'Parent PIN Override' : undefined,
    });

    setBlockedQueryState(null);
    const stored = getStoredApiKeys();

    // If a custom file is uploaded, upload it via /api/search first
    if (file) {
      const formData = new FormData();
      formData.append('topic', queryTopic);
      formData.append('depth', depth);
      formData.append('file', file);
      if (stored.searchKey) formData.append('searchKey', stored.searchKey);
      if (stored.searchProvider) formData.append('searchProvider', stored.searchProvider);

      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          startResearch(queryTopic, depth, lang, stored);
        } else {
          const errData = await res.json();
          alert(`File upload search failed: ${errData.error}`);
        }
      } catch (err: any) {
        alert(`Error uploading file: ${err.message}`);
      }
    } else {
      startResearch(queryTopic, depth, lang, stored);
    }
  };

  const hasData = sources.length > 0 || Boolean(summary) || Boolean(analysis);

  // Active Session for Export
  const currentSession: ResearchSession = {
    id: `export-${Date.now()}`,
    topic: topic || 'Current Research',
    depth: 'quick',
    language: summary?.language || 'en',
    createdAt: new Date().toISOString(),
    sources,
    relatedUrls,
    analysis: analysis || undefined,
    summary: summary || undefined,
    mindmap: mindmap || undefined,
    image: image || undefined,
  };

  return (
    <div className={`min-h-screen flex flex-col relative text-paper-text transition-colors ${focusState.isActive ? 'bg-[#FAF7F0] dark:bg-[#121619]' : ''}`}>
      {/* Living Paper WebGL/Canvas Animation (suspended in Zen Focus Mode for minimal distraction) */}
      {!focusState.isActive && <BackgroundScene isResearching={isResearching} isDark={isDark} />}

      {/* Floating Zen Focus Mode HUD Toolbar */}
      {focusState.isActive && (
        <FocusToolbar
          focusState={focusState}
          onUpdateFocusState={setFocusState}
          onExitFocus={() => setFocusState((prev) => ({ ...prev, isActive: false }))}
        />
      )}

      {/* Top Header */}
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenKeysModal={() => setIsKeysModalOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenParentalModal={() => setIsParentalModalOpen(true)}
        isParentalActive={parentalConfig.enabled && parentalConfig.level !== 'off'}
        onToggleFocusMode={toggleFocusMode}
        isFocusMode={focusState.isActive}
        keyStatus={keyStatus}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenStudentHub={() => setIsStudentHubOpen(true)}
      />

      <div className="flex flex-1">
        {/* Left-Side Tool Suite Navigation */}
        <LeftSidebar
          activeView={activeView}
          onSelectView={(view) => setActiveView(view)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Tool & Workspace Container */}
        <div
          className={`flex-1 transition-all duration-300 min-w-0 ${
            focusState.isActive
              ? 'pl-16'
              : isSidebarCollapsed ? 'pl-16' : 'pl-16 sm:pl-64'
          }`}
        >
          {activeView === 'research' && (
            <main className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 transition-all duration-300 ${
              focusState.isActive ? 'max-w-4xl py-8' : 'max-w-7xl'
            }`}>
              {/* Missing Key Warning Banner if core keys are not detected */}
              {keyStatus && (!keyStatus.searchKeySet || !keyStatus.llmKeySet) && (
                <div className="bg-terracotta-50/90 border border-terracotta-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-terracotta-700 shadow-paper-sm">
                  <div className="flex items-center space-x-2.5">
                    <AlertCircle className="w-5 h-5 text-terracotta shrink-0" />
                    <div>
                      <span className="font-bold">Zero-Mock Architecture:</span> Add{' '}
                      {!keyStatus.searchKeySet && <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-semibold">SEARCH_API_KEY</code>}
                      {!keyStatus.searchKeySet && !keyStatus.llmKeySet && ' and '}
                      {!keyStatus.llmKeySet && <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-semibold">LLM_API_KEY</code>}{' '}
                      to enable live web searches and AI trend synthesis.
                    </div>
                  </div>
                  <button
                    onClick={() => setIsKeysModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-terracotta text-white font-medium hover:bg-terracotta-600 transition shrink-0"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Configure Engine Keys</span>
                  </button>
                </div>
              )}

              {/* Hero Section if no query run yet */}
              {!hasData && !isResearching && (
                <div className="text-center py-10 sm:py-16 max-w-3xl mx-auto space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-paper-surface border border-paper-line text-xs text-terracotta font-medium shadow-paper-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Real-Time Web Intelligence & Quantitative Synthesis</span>
                  </div>
                  <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-paper-text leading-tight">
                    Investigate any idea with deep, grounded intelligence.
                  </h1>
                  <p className="text-sm sm:text-base text-paper-text-dim max-w-xl mx-auto leading-relaxed">
                    Fetches live web pages, extracts primary and miscellaneous outbound URLs, models trend momentum with real LLMs, and synthesizes interactive briefings.
                  </p>
                </div>
              )}

              {/* Search Input Bar */}
              <SearchBar onSearch={handleStartSearch} isResearching={isResearching} />

              {/* Parental SafeGuard Intercept Shield */}
              {blockedQueryState && (
                <SafeGuardShield
                  blockedTopic={blockedQueryState.blockedTopic}
                  safetyResult={blockedQueryState.safetyResult}
                  parentPin={parentalConfig.pin}
                  onSelectAlternative={(altTopic) => {
                    setBlockedQueryState(null);
                    handleStartSearch(altTopic, 'quick', 'en');
                  }}
                  onOpenParentalSettings={() => setIsParentalModalOpen(true)}
                  onParentBypass={() => {
                    const t = blockedQueryState.blockedTopic;
                    setBlockedQueryState(null);
                    handleStartSearch(t, 'quick', 'en', undefined, true);
                  }}
                />
              )}

              {/* Live Step Progress Timeline */}
              <ProgressTimeline progress={progress} onCancel={cancelResearch} />

              {/* Error Notification */}
              {error && (
                <div className="max-w-4xl mx-auto p-4 bg-terracotta-50 border border-terracotta-300 rounded-xl text-xs text-terracotta flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-paper-sm animate-in fade-in">
                  <div className="space-y-1">
                    <div className="font-bold flex items-center space-x-1.5 text-terracotta-700">
                      <AlertCircle className="w-4 h-4 shrink-0 text-terracotta" />
                      <span>Research Engine Notice:</span>
                    </div>
                    <p className="text-paper-text font-medium leading-relaxed">{error}</p>
                  </div>
                  <button
                    onClick={() => setIsKeysModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-terracotta text-white font-medium hover:bg-terracotta-600 transition shrink-0 self-start sm:self-auto"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Open API Setup</span>
                  </button>
                </div>
              )}

              {/* Export & Student Learning Action Bar (when data is ready) */}
              {hasData && (
                <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto pt-2">
                  <div className="font-serif text-xl sm:text-2xl font-bold text-paper-text">
                    Dossier: <span className="text-terracotta italic">&ldquo;{topic}&rdquo;</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Take Student Concept Quiz */}
                    <button
                      onClick={() => setIsQuizOpen(true)}
                      title="Take an interactive 3-question conceptual quiz on this topic"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sage/15 hover:bg-sage/25 border border-sage/40 text-sage text-xs font-semibold shadow-paper-sm transition"
                    >
                      <Trophy className="w-4 h-4 text-sage" />
                      <span>Take Concept Quiz</span>
                    </button>

                    {/* Save to Student Knowledge Vault */}
                    <button
                      onClick={handleSaveToVault}
                      disabled={isSavingToVault}
                      title="Save this dossier to your student knowledge vault"
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-paper-sm transition ${
                        vaultSaved
                          ? 'bg-sage/15 text-sage border-sage'
                          : 'bg-paper-surface hover:bg-paper-surface-2 border-paper-line text-paper-text'
                      }`}
                    >
                      {vaultSaved ? (
                        <CheckCircle className="w-4 h-4 text-sage" />
                      ) : (
                        <BookmarkPlus className="w-4 h-4 text-terracotta" />
                      )}
                      <span>{vaultSaved ? 'Saved in Vault' : 'Save to Vault'}</span>
                    </button>

                    {/* Export Dossier */}
                    <button
                      onClick={() => setIsExportOpen(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-paper-surface hover:bg-paper-surface-2 border border-paper-line shadow-paper-sm text-xs font-medium text-paper-text transition"
                    >
                      <FileDown className="w-4 h-4 text-terracotta" />
                      <span className="hidden sm:inline">Export (MD / PDF)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Research Panels Layout */}
              {hasData && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Top Row: Executive Summary & Generative Image */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                      <SummaryPanel
                        summary={summary}
                        topic={topic}
                        isMissingKey={missingKeys.includes('LLM_API_KEY')}
                        onOpenKeysModal={() => setIsKeysModalOpen(true)}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <ImagePanel
                        image={image}
                        topic={topic}
                        isMissingKey={missingKeys.includes('IMAGE_API_KEY')}
                        onOpenKeysModal={() => setIsKeysModalOpen(true)}
                      />
                    </div>
                  </div>

                  {/* Middle Row: Trend Analytics & Recharts */}
                  <TrendChart
                    analysis={analysis}
                    selectedSubtopic={selectedSubtopic}
                    onSelectSubtopic={(name) => setSelectedSubtopic(name)}
                    isMissingKey={missingKeys.includes('LLM_API_KEY')}
                    onOpenKeysModal={() => setIsKeysModalOpen(true)}
                  />

                  {/* Mindmap Generation */}
                  <Mindmap
                    mindmap={mindmap}
                    isMissingKey={missingKeys.includes('LLM_API_KEY')}
                    onOpenKeysModal={() => setIsKeysModalOpen(true)}
                  />

                  {/* Sources & Miscellaneous Outbound URLs */}
                  <SourceList
                    sources={
                      selectedSubtopic && analysis
                        ? sources.filter((s) => {
                            const matchingSubtopic = analysis.subtopics.find((st) => st.name === selectedSubtopic);
                            return matchingSubtopic?.sourceUrls?.includes(s.url) || s.snippet.toLowerCase().includes(selectedSubtopic.toLowerCase());
                          })
                        : sources
                    }
                    relatedUrls={relatedUrls}
                    selectedSubtopic={selectedSubtopic}
                    onClearFilter={() => setSelectedSubtopic(null)}
                    isMissingKey={missingKeys.includes('SEARCH_API_KEY')}
                    onOpenKeysModal={() => setIsKeysModalOpen(true)}
                  />

                  {/* Grounded Follow-up RAG Chat */}
                  <FollowUpChat
                    topic={topic}
                    sources={sources}
                    isMissingKey={missingKeys.includes('LLM_API_KEY')}
                    onOpenKeysModal={() => setIsKeysModalOpen(true)}
                  />
                </div>
              )}
            </main>
          )}

          {activeView === 'image-studio' && (
            <ImageStudioTool
              onOpenKeysModal={() => setIsKeysModalOpen(true)}
              parentalConfig={parentalConfig}
            />
          )}
          {activeView === 'file-chart' && <FileChartTool onOpenKeysModal={() => setIsKeysModalOpen(true)} />}
          {activeView === 'text-explainer' && (
            <TextExplainerTool
              onOpenKeysModal={() => setIsKeysModalOpen(true)}
              parentalConfig={parentalConfig}
            />
          )}
          {activeView === 'web-analyzer' && (
            <WebAnalyzerTool
              onOpenKeysModal={() => setIsKeysModalOpen(true)}
              parentalConfig={parentalConfig}
            />
          )}
          {activeView === 'syllabus-hub' && (
            <SyllabusTool
              onOpenKeysModal={() => setIsKeysModalOpen(true)}
              onLaunchResearch={(chapterTitle) => {
                setActiveView('research');
                handleStartSearch(chapterTitle, 'quick', 'en');
              }}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer
        className={`w-full border-t border-paper-line py-6 text-center text-xs text-paper-text-dim bg-paper-surface/50 backdrop-blur-xs transition-all duration-300 ${
          focusState.isActive
            ? 'pl-16'
            : isSidebarCollapsed ? 'pl-16' : 'pl-16 sm:pl-64'
        }`}
      >
        <p>AI Deep Researcher &bull; Live End-to-End Autonomous Intelligence &bull; Editorial Paper Palette</p>
      </footer>

      {/* Modals & Drawers */}
      <ParentalControlModal
        isOpen={isParentalModalOpen}
        onClose={() => setIsParentalModalOpen(false)}
        config={parentalConfig}
        onSaveConfig={handleSaveParentalConfig}
      />

      <ApiKeyModal
        isOpen={isKeysModalOpen}
        onClose={() => setIsKeysModalOpen(false)}
        keyStatus={keyStatus}
        onSaveKeys={handleSaveKeys}
      />

      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onOpenKeysModal={() => {
          setIsCompareOpen(false);
          setIsKeysModalOpen(true);
        }}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={(sess) => loadSession(sess)}
        parentalConfig={parentalConfig}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        session={currentSession}
      />

      {/* Student Portal & Learning Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      {currentUser && (
        <StudentHubModal
          isOpen={isStudentHubOpen}
          onClose={() => setIsStudentHubOpen(false)}
          user={currentUser}
          onLogout={handleLogout}
          onLoadDossierTopic={(t) => handleStartSearch(t, 'quick', 'en')}
          onUpdateUser={(u) => setCurrentUser(u)}
        />
      )}

      <StudentQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        topic={topic || 'Current Research Topic'}
        summaryContent={summary?.executiveSummary || summary?.summary_basic}
        gradeLevel={currentUser?.gradeLevel || 'high'}
        onQuizCompleted={() => {
          fetchCurrentUser().then((u) => {
            if (u) setCurrentUser(u);
          });
        }}
      />
    </div>
  );
};
export default App;
