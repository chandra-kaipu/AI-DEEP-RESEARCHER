import { useState, useCallback, useRef } from 'react';
import {
  ExtractedSource,
  RelatedLink,
  TrendAnalysisResult,
  SummaryResult,
  MindmapNode,
  ImageGenerationResult,
  ProgressState,
  ResearchSession,
} from '../types';

export function useResearchStream() {
  const [isResearching, setIsResearching] = useState(false);
  const [topic, setTopic] = useState('');
  const [sources, setSources] = useState<ExtractedSource[]>([]);
  const [relatedUrls, setRelatedUrls] = useState<RelatedLink[]>([]);
  const [analysis, setAnalysis] = useState<TrendAnalysisResult | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [mindmap, setMindmap] = useState<MindmapNode | null>(null);
  const [image, setImage] = useState<ImageGenerationResult | null>(null);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    stage: 'idle',
    step: 0,
    totalSteps: 6,
    message: '',
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startResearch = useCallback(
    (
      queryTopic: string,
      depth: 'quick' | 'deep' = 'quick',
      lang: string = 'en',
      customKeys?: {
        searchKey?: string;
        searchProvider?: string;
        llmKey?: string;
        llmProvider?: string;
        imageKey?: string;
        imageProvider?: string;
      }
    ) => {
      if (!queryTopic.trim()) return;

      // Reset previous state
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsResearching(true);
      setTopic(queryTopic);
      setSources([]);
      setRelatedUrls([]);
      setAnalysis(null);
      setSummary(null);
      setMindmap(null);
      setImage(null);
      setMissingKeys([]);
      setError(null);
      setProgress({
        stage: 'searching',
        step: 1,
        totalSteps: 6,
        message: `Initiating research on "${queryTopic}"...`,
      });

      const params = new URLSearchParams({
        topic: queryTopic,
        depth,
        lang,
      });

      if (customKeys?.searchKey) params.append('searchKey', customKeys.searchKey);
      if (customKeys?.searchProvider) params.append('searchProvider', customKeys.searchProvider);
      if (customKeys?.llmKey) params.append('llmKey', customKeys.llmKey);
      if (customKeys?.llmProvider) params.append('llmProvider', customKeys.llmProvider);
      if (customKeys?.imageKey) params.append('imageKey', customKeys.imageKey);
      if (customKeys?.imageProvider) params.append('imageProvider', customKeys.imageProvider);

      const es = new EventSource(`/api/research/stream?${params.toString()}`);
      eventSourceRef.current = es;

      es.addEventListener('status', (e) => {
        try {
          const data = JSON.parse(e.data);
          setProgress({
            stage: data.stage,
            step: data.step,
            totalSteps: data.totalSteps || 6,
            message: data.message,
          });
        } catch (err) {
          console.error(err);
        }
      });

      es.addEventListener('sources', (e) => {
        try {
          const data = JSON.parse(e.data);
          setSources(data.sources || []);
          setRelatedUrls(data.relatedUrls || []);
        } catch (err) {
          console.error(err);
        }
      });

      es.addEventListener('analysis', (e) => {
        try {
          const data = JSON.parse(e.data);
          setAnalysis(data);
        } catch (err) {
          console.error(err);
        }
      });

      es.addEventListener('summary', (e) => {
        try {
          const data = JSON.parse(e.data);
          setSummary(data);
        } catch (err) {
          console.error(err);
        }
      });

      es.addEventListener('mindmap', (e) => {
        try {
          const data = JSON.parse(e.data);
          setMindmap(data);
        } catch (err) {
          console.error(err);
        }
      });

      es.addEventListener('image', (e) => {
        try {
          const data = JSON.parse(e.data);
          setImage(data);
        } catch (err) {
          console.error(err);
        }
      });

      es.addEventListener('missing_key', (e) => {
        try {
          const data = JSON.parse(e.data);
          setMissingKeys((prev) => Array.from(new Set([...prev, data.key])));
        } catch (err) {
          console.error(err);
        }
      });

      es.addEventListener('done', (e) => {
        setIsResearching(false);
        setProgress((prev) => ({
          ...prev,
          stage: 'complete',
          message: 'Research successfully synthesized.',
        }));
        es.close();

        // Save session to local storage
        try {
          const data = JSON.parse(e.data);
          const historyRaw = localStorage.getItem('ai_deep_researcher_history');
          const history: ResearchSession[] = historyRaw ? JSON.parse(historyRaw) : [];
          const newSession: ResearchSession = {
            id: data.id || `session-${Date.now()}`,
            topic: queryTopic,
            depth,
            language: lang,
            createdAt: data.completedAt || new Date().toISOString(),
            sources,
            relatedUrls,
            analysis: analysis || undefined,
            summary: summary || undefined,
            mindmap: mindmap || undefined,
            image: image || undefined,
          };
          history.unshift(newSession);
          localStorage.setItem('ai_deep_researcher_history', JSON.stringify(history.slice(0, 20)));
        } catch (err) {
          console.error('Failed to save session history:', err);
        }
      });

      es.addEventListener('error', (e: any) => {
        let errMsg = 'Connection closed or server error.';
        try {
          if (e.data) {
            const data = JSON.parse(e.data);
            errMsg = data.message || errMsg;
          }
        } catch {}
        setError(errMsg);
        setIsResearching(false);
        setProgress((prev) => ({ ...prev, stage: 'error', message: errMsg }));
        es.close();
      });

      es.onerror = () => {
        setIsResearching(false);
        es.close();
      };
    },
    [sources, relatedUrls, analysis, summary, mindmap, image]
  );

  const cancelResearch = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsResearching(false);
    setProgress((prev) => ({ ...prev, stage: 'idle', message: 'Research stopped.' }));
  }, []);

  const loadSession = useCallback((session: ResearchSession) => {
    setTopic(session.topic);
    setSources(session.sources || []);
    setRelatedUrls(session.relatedUrls || []);
    setAnalysis(session.analysis || null);
    setSummary(session.summary || null);
    setMindmap(session.mindmap || null);
    setImage(session.image || null);
    setMissingKeys([]);
    setError(null);
    setProgress({
      stage: 'complete',
      step: 6,
      totalSteps: 6,
      message: 'Loaded from past research session.',
    });
  }, []);

  return {
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
  };
}
