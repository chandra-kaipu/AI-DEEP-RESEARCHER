import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  GitFork,
  BookOpen,
  GraduationCap,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle,
  Clock,
  Compass,
  Database,
  Cloud,
  HardDrive,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  FileText,
  HelpCircle,
  X,
  ExternalLink,
  Loader2,
  Upload,
  FileUp,
  Paperclip,
  Trash2,
  FileCheck,
  Eye,
  Download,
  Info,
} from 'lucide-react';
import { SyllabusCourse, SyllabusChapter, MindmapNode, DbConfig, UserProfile, UnitMaterial } from '../../types';
import { getStoredApiKeys } from '../../utils/keys';

interface SyllabusToolProps {
  onOpenKeysModal: () => void;
  onLaunchResearch: (topic: string) => void;
  currentUser: UserProfile | null;
}

export const SyllabusTool: React.FC<SyllabusToolProps> = ({
  onOpenKeysModal,
  onLaunchResearch,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'mindmap' | 'cloud'>('syllabus');

  // Courses and syllabus state
  const [courses, setCourses] = useState<SyllabusCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('cs-ai-foundations');
  const [chapterStatuses, setChapterStatuses] = useState<Record<string, 'not_started' | 'in_progress' | 'mastered'>>(() => {
    try {
      const saved = localStorage.getItem('ai_deep_researcher_syllabus_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Unit-by-unit uploaded materials (persisted in localStorage)
  const [unitMaterialsMap, setUnitMaterialsMap] = useState<Record<string, UnitMaterial[]>>(() => {
    try {
      const saved = localStorage.getItem('ai_deep_researcher_unit_materials');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveUnitMaterials = (updated: Record<string, UnitMaterial[]>) => {
    setUnitMaterialsMap(updated);
    try {
      localStorage.setItem('ai_deep_researcher_unit_materials', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save unit materials:', e);
    }
  };

  // Unit uploading loading state
  const [uploadingUnitId, setUploadingUnitId] = useState<string | null>(null);

  // Custom course generation form & PDF upload modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customModalTab, setCustomModalTab] = useState<'upload_file' | 'prompt'>('upload_file');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [customSyllabusTextInput, setCustomSyllabusTextInput] = useState('');
  const [isGeneratingSyllabus, setIsGeneratingSyllabus] = useState(false);

  // Mindmap studio state
  const [mindmapTopic, setMindmapTopic] = useState('Transformer Architecture & Generative AI');
  const [currentMindmap, setCurrentMindmap] = useState<MindmapNode | null>(null);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [selectedMindmapNode, setSelectedMindmapNode] = useState<{
    label: string;
    snippet?: string;
    application?: string;
  } | null>(null);
  const [groundedDocSource, setGroundedDocSource] = useState<string | null>(null);

  // Material preview modal
  const [previewMaterial, setPreviewMaterial] = useState<UnitMaterial | null>(null);

  // Cloud & DB config state
  const [dbConfig, setDbConfig] = useState<DbConfig | null>(null);

  // Load preset syllabi on mount
  useEffect(() => {
    fetch('/api/syllabus/presets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.syllabi)) {
          setCourses(data.syllabi);
        }
      })
      .catch((err) => console.error('Error fetching syllabi:', err));

    fetch('/api/syllabus/storage-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setDbConfig(data.config);
        }
      })
      .catch((err) => console.error('Error fetching db status:', err));
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleToggleStatus = (chapterId: string) => {
    const current = chapterStatuses[chapterId] || 'not_started';
    const next: 'not_started' | 'in_progress' | 'mastered' =
      current === 'not_started' ? 'in_progress' : current === 'in_progress' ? 'mastered' : 'not_started';
    const updated: Record<string, 'not_started' | 'in_progress' | 'mastered'> = {
      ...chapterStatuses,
      [chapterId]: next,
    };
    setChapterStatuses(updated);
    try {
      localStorage.setItem('ai_deep_researcher_syllabus_progress', JSON.stringify(updated));
    } catch {}
  };

  // Upload unit-specific reference material / PDF / notes
  const handleUploadUnitMaterial = async (
    e: React.ChangeEvent<HTMLInputElement>,
    chapter: SyllabusChapter,
    subjectTitle: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingUnitId(chapter.id);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chapterId', chapter.id);
    formData.append('chapterTitle', chapter.title);
    formData.append('subject', subjectTitle);

    const { llmKey, llmProvider } = getStoredApiKeys();
    if (llmKey) formData.append('customKey', llmKey);
    if (llmProvider) formData.append('customProvider', llmProvider);

    try {
      const res = await fetch('/api/syllabus/unit/upload-material', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload unit material.');
      }

      const key = `${selectedCourseId}_${chapter.id}`;
      const existing = unitMaterialsMap[key] || [];
      const updatedMaterials = [data.material, ...existing];
      const updatedMap = {
        ...unitMaterialsMap,
        [key]: updatedMaterials,
      };
      saveUnitMaterials(updatedMap);

      // If new key concepts were extracted, enrich chapter
      if (Array.isArray(data.extractedKeyConcepts) && data.extractedKeyConcepts.length > 0) {
        setCourses((prevCourses) =>
          prevCourses.map((c) => {
            if (c.id !== selectedCourseId) return c;
            return {
              ...c,
              chapters: c.chapters.map((ch) => {
                if (ch.id !== chapter.id) return ch;
                const merged = Array.from(new Set([...ch.keyConcepts, ...data.extractedKeyConcepts]));
                return { ...ch, keyConcepts: merged };
              }),
            };
          })
        );
      }
    } catch (err: any) {
      console.error('Unit upload error:', err);
      alert(`Error uploading file to Unit ${chapter.number}: ${err.message}`);
    } finally {
      setUploadingUnitId(null);
      e.target.value = '';
    }
  };

  const handleDeleteUnitMaterial = (chapterId: string, materialId: string) => {
    const key = `${selectedCourseId}_${chapterId}`;
    const existing = unitMaterialsMap[key] || [];
    const updated = existing.filter((m) => m.id !== materialId);
    saveUnitMaterials({
      ...unitMaterialsMap,
      [key]: updated,
    });
  };

  // Generate interactive mindmap directly from an uploaded unit document
  const handleGenerateMindmapFromMaterial = async (material: UnitMaterial, chapterTitle: string) => {
    setActiveTab('mindmap');
    setMindmapTopic(`${chapterTitle} (${material.name})`);
    setGroundedDocSource(material.name);
    setIsGeneratingMindmap(true);
    setSelectedMindmapNode(null);

    const { llmKey, llmProvider } = getStoredApiKeys();

    try {
      const res = await fetch('/api/syllabus/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: `${chapterTitle}: ${material.name}`,
          subject: `${selectedCourse?.subject || ''} (Grounded in uploaded document: ${material.name}. Summary: ${material.extractedSnippet || ''})`,
          gradeLevel: currentUser?.gradeLevel || 'high',
          customKey: llmKey || undefined,
          customProvider: llmProvider || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.mindmap) {
        setCurrentMindmap(data.mindmap);
      }
    } catch (err) {
      console.error('Failed to generate mindmap from unit material:', err);
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  // Upload PDF/Document directly in the Mindmap Studio to generate a grounded mindmap
  const handleMindmapFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGeneratingMindmap(true);
    setSelectedMindmapNode(null);
    const cleanTopic = file.name.replace(/\.[^/.]+$/, '');
    setMindmapTopic(cleanTopic);
    setGroundedDocSource(file.name);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('topic', cleanTopic);
    formData.append('gradeLevel', currentUser?.gradeLevel || 'high');

    const { llmKey, llmProvider } = getStoredApiKeys();
    if (llmKey) formData.append('customKey', llmKey);
    if (llmProvider) formData.append('customProvider', llmProvider);

    try {
      const res = await fetch('/api/syllabus/mindmap-from-file', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate mindmap from uploaded file.');
      }

      setCurrentMindmap(data.mindmap);
    } catch (err: any) {
      console.error('Mindmap file upload error:', err);
      alert(`Error generating mindmap: ${err.message}`);
    } finally {
      setIsGeneratingMindmap(false);
      e.target.value = '';
    }
  };

  // Upload full syllabus PDF / Document to generate course units
  const handleSyllabusPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGeneratingSyllabus(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('gradeLevel', currentUser?.gradeLevel || 'high');

    const { llmKey, llmProvider } = getStoredApiKeys();
    if (llmKey) formData.append('customKey', llmKey);
    if (llmProvider) formData.append('customProvider', llmProvider);

    try {
      const res = await fetch('/api/syllabus/upload-syllabus-file', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse syllabus document.');
      }

      setCourses((prev) => [data.syllabus, ...prev]);
      setSelectedCourseId(data.syllabus.id);
      setIsCustomModalOpen(false);
      alert(`Syllabus parsed successfully! Loaded "${data.syllabus.subject}" with ${data.syllabus.chapters.length} units.`);
    } catch (err: any) {
      console.error('Syllabus file upload error:', err);
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsGeneratingSyllabus(false);
      e.target.value = '';
    }
  };

  const handleGenerateCustomSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSubjectInput.trim()) return;

    setIsGeneratingSyllabus(true);
    const { llmKey, llmProvider } = getStoredApiKeys();

    try {
      const res = await fetch('/api/syllabus/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: customSubjectInput,
          syllabusText: customSyllabusTextInput,
          gradeLevel: currentUser?.gradeLevel || 'high',
          customKey: llmKey || undefined,
          customProvider: llmProvider || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.syllabus) {
        setCourses((prev) => [data.syllabus, ...prev]);
        setSelectedCourseId(data.syllabus.id);
        setIsCustomModalOpen(false);
        setCustomSubjectInput('');
        setCustomSyllabusTextInput('');
      } else {
        alert(data.error || 'Failed to generate syllabus.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGeneratingSyllabus(false);
    }
  };

  const handleLoadChapterMindmap = async (chapterTitle: string, subjectTitle: string) => {
    setMindmapTopic(chapterTitle);
    setGroundedDocSource(null);
    setActiveTab('mindmap');
    setIsGeneratingMindmap(true);
    setSelectedMindmapNode(null);

    const { llmKey, llmProvider } = getStoredApiKeys();

    try {
      const res = await fetch('/api/syllabus/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle,
          subject: subjectTitle,
          gradeLevel: currentUser?.gradeLevel || 'high',
          customKey: llmKey || undefined,
          customProvider: llmProvider || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.mindmap) {
        setCurrentMindmap(data.mindmap);
      }
    } catch (err) {
      console.error('Failed to generate chapter mindmap:', err);
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  // Convert mindmap tree to React Flow graph
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!currentMindmap) return { flowNodes: [], flowEdges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const rootId = 'root';
    nodes.push({
      id: rootId,
      position: { x: 340, y: 30 },
      data: {
        label: (
          <div
            onClick={() =>
              setSelectedMindmapNode({
                label: currentMindmap.label,
                snippet: currentMindmap.summarySnippet,
              })
            }
            className="p-3 bg-terracotta text-white rounded-xl shadow-paper-md text-center max-w-[240px] cursor-pointer hover:ring-2 hover:ring-white/50 transition"
          >
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-85">Chapter Core</div>
            <div className="font-serif font-bold text-sm leading-tight mt-0.5">{currentMindmap.label}</div>
          </div>
        ),
      },
      style: { border: 'none', background: 'transparent' },
    });

    const pillars = currentMindmap.children || [];
    const numPillars = pillars.length;
    const spacing = 260;
    const startX = 340 - ((numPillars - 1) * spacing) / 2;

    pillars.forEach((pillar, pIdx) => {
      const pillarId = `p-${pIdx}`;
      const px = startX + pIdx * spacing;
      const py = 160;

      nodes.push({
        id: pillarId,
        position: { x: px, y: py },
        data: {
          label: (
            <div
              onClick={() =>
                setSelectedMindmapNode({
                  label: pillar.label,
                  snippet: pillar.summarySnippet,
                })
              }
              className="p-2.5 bg-paper-surface border-2 border-sage text-paper-text rounded-xl shadow-paper-sm text-center max-w-[210px] cursor-pointer hover:border-terracotta transition"
            >
              <div className="text-[9px] uppercase font-semibold text-sage">Pillar {pIdx + 1}</div>
              <div className="font-serif font-semibold text-xs leading-tight mt-0.5">{pillar.label}</div>
            </div>
          ),
        },
        style: { border: 'none', background: 'transparent' },
      });

      edges.push({
        id: `e-root-${pillarId}`,
        source: rootId,
        target: pillarId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#D97757', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#D97757' },
      });

      // Child concept nodes
      const details = pillar.children || [];
      details.forEach((det: any, dIdx: number) => {
        const detId = `det-${pIdx}-${dIdx}`;
        const dx = px - 30 + (dIdx % 2 === 0 ? -30 : 30);
        const dy = py + 100 + dIdx * 75;

        nodes.push({
          id: detId,
          position: { x: dx, y: dy },
          data: {
            label: (
              <div
                onClick={() =>
                  setSelectedMindmapNode({
                    label: det.label,
                    snippet: det.summarySnippet,
                    application: det.realWorldApplication,
                  })
                }
                className="p-2.5 bg-paper-surface-2 border border-paper-line hover:border-terracotta text-paper-text rounded-lg shadow-paper-sm text-left max-w-[190px] cursor-pointer transition group"
              >
                <div className="font-sans text-[11px] font-semibold text-terracotta group-hover:underline">
                  {det.label}
                </div>
                {det.summarySnippet && (
                  <div className="text-[9px] text-paper-text-dim mt-0.5 line-clamp-2">{det.summarySnippet}</div>
                )}
              </div>
            ),
          },
          style: { border: 'none', background: 'transparent' },
        });

        edges.push({
          id: `e-${pillarId}-${detId}`,
          source: pillarId,
          target: detId,
          type: 'smoothstep',
          style: { stroke: '#788c7a', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#788c7a' },
        });
      });
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [currentMindmap]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-paper-surface border border-paper-line rounded-2xl shadow-paper-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-terracotta/15 flex items-center justify-center text-terracotta shrink-0">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-paper-text">
                Syllabus & Generative Mindmap Suite
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sage/15 text-sage border border-sage/30">
                Unit Materials & PDF Uploads
              </span>
            </div>
            <p className="text-xs text-paper-text-dim mt-1">
              Upload study PDFs & documents unit-by-unit, generate instant conceptual mindmaps & sync to 5TB cloud storage.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-paper-surface-2 p-1 rounded-xl border border-paper-line text-xs font-semibold">
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'syllabus'
                ? 'bg-paper-surface text-terracotta shadow-sm font-bold'
                : 'text-paper-text-dim hover:text-paper-text'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Curriculum & Unit Uploads</span>
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'mindmap'
                ? 'bg-paper-surface text-terracotta shadow-sm font-bold'
                : 'text-paper-text-dim hover:text-paper-text'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mindmap Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'cloud'
                ? 'bg-paper-surface text-terracotta shadow-sm font-bold'
                : 'text-paper-text-dim hover:text-paper-text'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-sage" />
            <span>Cloud & 5TB Storage</span>
          </button>
        </div>
      </div>

      {/* 1. Syllabus Roadmap Tab */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Course Selector Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                    selectedCourseId === course.id
                      ? 'bg-terracotta text-white border-terracotta shadow-sm'
                      : 'bg-paper-surface hover:bg-paper-surface-2 border-paper-line text-paper-text'
                  }`}
                >
                  {course.subject}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-paper-surface hover:bg-paper-surface-2 border border-dashed border-terracotta/60 text-xs font-semibold text-terracotta shadow-sm transition shrink-0"
            >
              <FileUp className="w-4 h-4" />
              <span>Upload Syllabus PDF / Create Course</span>
            </button>
          </div>

          {/* Chapters List */}
          {selectedCourse && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-paper-text-dim px-1">
                <span>
                  Course: <strong className="text-paper-text">{selectedCourse.subject}</strong> ({selectedCourse.chapters.length} Units)
                </span>
                <span className="font-mono">
                  Progress:{' '}
                  {
                    Object.values(chapterStatuses).filter((s) => s === 'mastered').length
                  }{' '}
                  / {selectedCourse.chapters.length} Mastered
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {selectedCourse.chapters.map((ch) => {
                  const status = chapterStatuses[ch.id] || 'not_started';
                  const unitKey = `${selectedCourse.id}_${ch.id}`;
                  const unitMaterials = unitMaterialsMap[unitKey] || [];
                  const isUnitUploading = uploadingUnitId === ch.id;

                  return (
                    <div
                      key={ch.id}
                      className="p-5 rounded-2xl bg-paper-surface border border-paper-line hover:border-terracotta/40 transition-all shadow-paper-sm space-y-4 group"
                    >
                      {/* Top Header of Unit */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-paper-surface-2 border border-paper-line font-bold text-terracotta">
                              Unit {ch.number}
                            </span>
                            <h3 className="font-serif text-base font-bold text-paper-text group-hover:text-terracotta transition-colors">
                              {ch.title}
                            </h3>
                            {/* Status Clickable Badge */}
                            <button
                              onClick={() => handleToggleStatus(ch.id)}
                              title="Click to toggle learning status"
                              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                                status === 'mastered'
                                  ? 'bg-sage/15 text-sage border-sage/40'
                                  : status === 'in_progress'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40'
                                  : 'bg-paper-surface-2 text-paper-text-dim border-paper-line'
                              }`}
                            >
                              {status === 'mastered'
                                ? '✓ Mastered'
                                : status === 'in_progress'
                                ? '⏳ Studying'
                                : '○ Not Started'}
                            </button>
                          </div>

                          <p className="text-xs text-paper-text-dim leading-relaxed max-w-3xl">
                            {ch.overview}
                          </p>

                          {/* Core Concepts */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-paper-text-dim uppercase font-mono font-semibold">
                              Concepts:
                            </span>
                            {ch.keyConcepts.map((concept, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-2 py-0.5 rounded-lg bg-paper-surface-2 border border-paper-line text-paper-text"
                              >
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                          <button
                            onClick={() => handleLoadChapterMindmap(ch.title, selectedCourse.subject)}
                            title="Generate interactive concept mindmap for this chapter"
                            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-paper-surface-2 hover:bg-paper-surface hover:text-terracotta border border-paper-line text-xs font-semibold text-paper-text transition shadow-sm"
                          >
                            <GitFork className="w-3.5 h-3.5 text-sage" />
                            <span>Concept Mindmap</span>
                          </button>

                          <button
                            onClick={() => onLaunchResearch(ch.title)}
                            title="Launch full autonomous multi-source deep research for this chapter"
                            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold shadow-paper-sm transition"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Deep Research</span>
                          </button>
                        </div>
                      </div>

                      {/* Unit Uploads Section ("Uploads according to the units") */}
                      <div className="pt-3 border-t border-paper-line/70 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-3.5 h-3.5 text-terracotta" />
                            <span className="text-xs font-semibold text-paper-text">
                              Unit {ch.number} Materials & Uploads
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-paper-surface-2 text-paper-text-dim border border-paper-line">
                              {unitMaterials.length} attached
                            </span>
                          </div>

                          {/* Unit Upload Trigger */}
                          <div>
                            <input
                              type="file"
                              id={`unit-file-input-${ch.id}`}
                              accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,image/*"
                              onChange={(e) => handleUploadUnitMaterial(e, ch, selectedCourse.subject)}
                              disabled={isUnitUploading}
                              className="hidden"
                            />
                            <label
                              htmlFor={`unit-file-input-${ch.id}`}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-paper-surface-2 hover:bg-paper-surface border border-paper-line hover:border-terracotta/50 text-xs font-semibold text-paper-text cursor-pointer transition shadow-2xs"
                            >
                              {isUnitUploading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-terracotta" />
                                  <span>Analyzing PDF & Extracting Concepts...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-terracotta" />
                                  <span>Upload Unit Material (PDF / Notes)</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* List of Attached Unit Materials */}
                        {unitMaterials.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {unitMaterials.map((mat) => (
                              <div
                                key={mat.id}
                                className="p-3 rounded-xl bg-paper-surface-2 border border-paper-line hover:border-paper-line/80 flex flex-col justify-between space-y-2 text-xs group"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <span className="p-1.5 rounded-lg bg-terracotta/10 text-terracotta shrink-0">
                                      <FileCheck className="w-4 h-4" />
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-paper-text text-xs truncate" title={mat.name}>
                                        {mat.name}
                                      </p>
                                      <div className="flex items-center space-x-1.5 text-[10px] text-paper-text-dim font-mono mt-0.5">
                                        <span>{(mat.size / 1024).toFixed(1)} KB</span>
                                        <span>&bull;</span>
                                        <span>{new Date(mat.uploadedAt).toLocaleDateString()}</span>
                                        <span>&bull;</span>
                                        <span className="text-sage font-medium">5TB Cloud</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => setPreviewMaterial(mat)}
                                      className="p-1 text-paper-text-dim hover:text-paper-text transition"
                                      title="Preview extracted insights"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUnitMaterial(ch.id, mat.id)}
                                      className="p-1 text-paper-text-dim hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                      title="Remove material"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Key Insights / Takeaways from PDF */}
                                {mat.keyInsights && mat.keyInsights.length > 0 && (
                                  <div className="text-[11px] text-paper-text-dim space-y-0.5 bg-paper-surface p-2 rounded-lg border border-paper-line/50">
                                    <span className="font-semibold text-paper-text block text-[9px] uppercase tracking-wider text-sage font-mono">
                                      Extracted Unit Insights:
                                    </span>
                                    {mat.keyInsights.slice(0, 2).map((insight, idx) => (
                                      <div key={idx} className="line-clamp-1">
                                        &bull; {insight}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Action button to generate mindmap from this specific uploaded document */}
                                <div className="flex items-center justify-between pt-1 border-t border-paper-line/40">
                                  <button
                                    onClick={() => handleGenerateMindmapFromMaterial(mat, ch.title)}
                                    className="text-[11px] text-terracotta hover:underline font-semibold flex items-center space-x-1"
                                  >
                                    <GitFork className="w-3 h-3" />
                                    <span>Build Mindmap from this File</span>
                                  </button>
                                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-sage/10 text-sage border border-sage/20">
                                    Unit {ch.number}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-paper-text-dim italic">
                            No materials uploaded for Unit {ch.number} yet. Upload chapter lecture PDFs, slides, or problem sets to automatically extract concepts and enrich your unit mindmap.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Interactive Mindmap Studio Tab */}
      {activeTab === 'mindmap' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Mindmap Generator Input Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-paper-surface p-4 rounded-2xl border border-paper-line shadow-paper-sm">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-paper-text-dim" />
              <input
                type="text"
                value={mindmapTopic}
                onChange={(e) => setMindmapTopic(e.target.value)}
                placeholder="Enter curriculum topic or chapter title to generate mindmap..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-paper-surface-2 border border-paper-line text-xs text-paper-text focus:ring-2 focus:ring-terracotta focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {/* File Upload for Mindmap Generation */}
              <input
                type="file"
                id="mindmap-file-input"
                accept=".pdf,.doc,.docx,.txt,.md,.json"
                onChange={handleMindmapFileUpload}
                disabled={isGeneratingMindmap}
                className="hidden"
              />
              <label
                htmlFor="mindmap-file-input"
                title="Upload a PDF or document to generate a mindmap directly from its content"
                className="px-3.5 py-2.5 rounded-xl bg-paper-surface-2 hover:bg-paper-surface border border-paper-line hover:border-terracotta text-paper-text text-xs font-semibold cursor-pointer transition shadow-sm flex items-center space-x-1.5 shrink-0"
              >
                <FileUp className="w-4 h-4 text-sage" />
                <span>Upload PDF / Notes</span>
              </label>

              <button
                onClick={() => handleLoadChapterMindmap(mindmapTopic, selectedCourse?.subject || '')}
                disabled={isGeneratingMindmap}
                className="px-5 py-2.5 rounded-xl bg-terracotta text-white font-semibold text-xs hover:bg-terracotta-600 transition shadow-sm flex items-center justify-center space-x-2 shrink-0"
              >
                {isGeneratingMindmap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate Mindmap</span>
              </button>
            </div>
          </div>

          {/* Grounded Source Notice */}
          {groundedDocSource && (
            <div className="p-3 rounded-xl bg-sage/10 border border-sage/25 text-sage text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4" />
                <span>
                  Mindmap grounded in uploaded material: <strong className="underline">{groundedDocSource}</strong>
                </span>
              </div>
              <button
                onClick={() => setGroundedDocSource(null)}
                className="text-[11px] hover:underline text-paper-text-dim hover:text-paper-text"
              >
                Clear
              </button>
            </div>
          )}

          {/* Interactive ReactFlow Canvas */}
          <div className="h-[620px] w-full rounded-2xl border border-paper-line overflow-hidden bg-paper-surface-2 relative shadow-paper-sm">
            {isGeneratingMindmap && (
              <div className="absolute inset-0 z-20 bg-paper-surface/75 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
                <p className="font-serif text-sm font-semibold text-paper-text">
                  Synthesizing Hierarchical Mindmap...
                </p>
                <p className="text-xs text-paper-text-dim">
                  Deconstructing concepts into first principles and mechanisms.
                </p>
              </div>
            )}

            {flowNodes.length > 0 ? (
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                attributionPosition="bottom-left"
              >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#d6d0c4" />
                <Controls className="bg-paper-surface border border-paper-line rounded-xl shadow-paper-sm text-paper-text" />
              </ReactFlow>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-paper-text-dim space-y-2">
                <Layers className="w-12 h-12 text-paper-text-dim/40" />
                <h4 className="font-serif font-bold text-base text-paper-text">No Mindmap Loaded</h4>
                <p className="text-xs max-w-sm">
                  Select &ldquo;Concept Mindmap&rdquo; from any syllabus unit above, upload a PDF/notes file, or search a topic to render an interactive visual knowledge tree.
                </p>
              </div>
            )}
          </div>

          {/* Selected Node Details Drawer */}
          {selectedMindmapNode && (
            <div className="p-4 rounded-xl bg-paper-surface border border-paper-line shadow-paper-sm space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-terracotta" />
                  <h4 className="font-serif font-bold text-sm text-paper-text">
                    {selectedMindmapNode.label}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedMindmapNode(null)}
                  className="text-paper-text-dim hover:text-paper-text text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedMindmapNode.snippet && (
                <p className="text-xs text-paper-text-dim leading-relaxed">
                  {selectedMindmapNode.snippet}
                </p>
              )}

              {selectedMindmapNode.application && (
                <div className="p-2.5 rounded-lg bg-sage/10 border border-sage/30 text-xs text-paper-text space-y-0.5">
                  <span className="font-semibold text-sage block text-[10px] uppercase font-mono">
                    Real-World Implementation:
                  </span>
                  <p>{selectedMindmapNode.application}</p>
                </div>
              )}

              <div className="pt-1 flex items-center justify-end">
                <button
                  onClick={() => onLaunchResearch(selectedMindmapNode.label)}
                  className="inline-flex items-center space-x-1.5 text-xs text-terracotta hover:underline font-semibold"
                >
                  <span>Launch Deep Research on &ldquo;{selectedMindmapNode.label}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Cloud & 5TB Storage Tab */}
      {activeTab === 'cloud' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Sync Card */}
            <div className="p-6 rounded-2xl bg-paper-surface border border-paper-line shadow-paper-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta/15 flex items-center justify-center text-terracotta">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-paper-text">Database Integration</h3>
                  <p className="text-xs text-paper-text-dim">PostgreSQL &bull; Supabase &bull; MongoDB</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-paper-surface-2 border border-paper-line space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-paper-text-dim">Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sage/15 text-sage">
                    ✓ {dbConfig?.status || 'Active Local Cache'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-paper-text-dim">Engine:</span>
                  <span className="font-mono text-paper-text uppercase font-semibold">
                    {dbConfig?.type || 'Persistent Disk Store'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-paper-text-dim space-y-2 leading-relaxed">
                <p>
                  <strong>Connecting a Cloud Database:</strong> You can connect Supabase, PostgreSQL, or MongoDB anytime by adding your connection string:
                </p>
                <code className="block p-2 rounded-lg bg-paper-surface-2 font-mono text-[11px] text-terracotta border border-paper-line select-all">
                  DATABASE_URL=&quot;postgres://user:password@host:5432/dbname&quot;
                </code>
              </div>
            </div>

            {/* 5TB Google Cloud Storage Card */}
            <div className="p-6 rounded-2xl bg-paper-surface border border-paper-line shadow-paper-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sage/15 flex items-center justify-center text-sage">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-paper-text">5TB Cloud Storage Sync</h3>
                  <p className="text-xs text-paper-text-dim">Google Mail & Cloud Drive Archival</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-paper-surface-2 border border-paper-line space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-paper-text-dim">Storage Capacity:</span>
                  <span className="font-mono font-bold text-sage">
                    {dbConfig?.storageQuota || '5 TB Ready'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-paper-text-dim">Cloud Sync Mode:</span>
                  <span className="font-mono text-paper-text">Dossiers, PDFs & Mindmaps</span>
                </div>
              </div>

              <div className="text-xs text-paper-text-dim space-y-1.5 leading-relaxed">
                <p>
                  <strong>Google Workspace Integration:</strong> Your 5TB Google Cloud storage can automatically archive exported research dossiers, unit study PDFs, and generative mindmaps.
                </p>
                <div className="p-2.5 rounded-lg bg-sage/10 text-sage border border-sage/30 text-[11px] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Google Mail OAuth sign-in is enabled and ready to sync with your drive!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-paper-surface border border-paper-line rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-paper-line pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-terracotta" />
                <h3 className="font-serif text-base font-bold text-paper-text truncate max-w-sm">
                  {previewMaterial.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="text-paper-text-dim hover:text-paper-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-paper-surface-2 border border-paper-line font-mono text-[11px]">
                <span>Size: {(previewMaterial.size / 1024).toFixed(1)} KB</span>
                <span>Uploaded: {new Date(previewMaterial.uploadedAt).toLocaleString()}</span>
                <span className="text-sage font-bold">5TB Cloud Stored</span>
              </div>

              {previewMaterial.keyInsights && previewMaterial.keyInsights.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold text-paper-text block uppercase font-mono text-[10px] text-terracotta">
                    Key Conceptual Takeaways:
                  </span>
                  <ul className="space-y-1 bg-paper-surface-2 p-3 rounded-xl border border-paper-line">
                    {previewMaterial.keyInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-paper-text-dim">
                        <CheckCircle className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {previewMaterial.extractedSnippet && (
                <div className="space-y-1">
                  <span className="font-semibold text-paper-text block uppercase font-mono text-[10px] text-paper-text-dim">
                    Extracted Text Preview:
                  </span>
                  <div className="max-h-40 overflow-y-auto p-3 rounded-xl bg-paper-surface-2 border border-paper-line text-[11px] text-paper-text-dim leading-relaxed font-mono">
                    {previewMaterial.extractedSnippet}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-paper-line">
              <button
                type="button"
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 rounded-xl bg-terracotta text-white font-semibold text-xs hover:bg-terracotta-600 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Syllabus Generator Modal (With PDF Upload & Manual Outline Tabs) */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-paper-surface border border-paper-line rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-paper-line pb-3">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-terracotta" />
                <h3 className="font-serif text-base font-bold text-paper-text">
                  Import or Generate Course Syllabus
                </h3>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-paper-text-dim hover:text-paper-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: File Upload vs AI Prompt */}
            <div className="flex border-b border-paper-line pb-2 space-x-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCustomModalTab('upload_file')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                  customModalTab === 'upload_file'
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'bg-paper-surface-2 text-paper-text-dim hover:text-paper-text'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload Syllabus PDF / Document</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomModalTab('prompt')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                  customModalTab === 'prompt'
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'bg-paper-surface-2 text-paper-text-dim hover:text-paper-text'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Subject & Outline Prompt</span>
              </button>
            </div>

            {/* Tab 1: Upload Syllabus PDF */}
            {customModalTab === 'upload_file' ? (
              <div className="space-y-4 py-2">
                <div className="p-6 border-2 border-dashed border-terracotta/40 hover:border-terracotta rounded-2xl bg-paper-surface-2 text-center space-y-3 transition">
                  <div className="w-12 h-12 rounded-full bg-terracotta/10 text-terracotta mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-paper-text">
                      Select or drop your Course Syllabus PDF, Word doc, or text file
                    </p>
                    <p className="text-[11px] text-paper-text-dim mt-0.5">
                      Supports .pdf, .docx, .txt, .md (up to 25MB). AI will automatically parse all course units.
                    </p>
                  </div>

                  <input
                    type="file"
                    id="full-syllabus-file-upload"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleSyllabusPdfUpload}
                    disabled={isGeneratingSyllabus}
                    className="hidden"
                  />
                  <label
                    htmlFor="full-syllabus-file-upload"
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white font-semibold text-xs cursor-pointer shadow-sm transition"
                  >
                    {isGeneratingSyllabus ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing Syllabus Document...</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-4 h-4" />
                        <span>Browse & Upload Syllabus</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            ) : (
              /* Tab 2: AI Subject & Outline Prompt */
              <form onSubmit={handleGenerateCustomSyllabus} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-paper-text mb-1">
                    Course or Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    placeholder="e.g. Organic Chemistry II, AP Microeconomics, Quantum Computing"
                    className="w-full px-3 py-2 rounded-xl bg-paper-surface-2 border border-paper-line text-xs focus:ring-1 focus:ring-terracotta focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paper-text mb-1">
                    Paste Syllabus Outline, Chapter List, or Notes (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={customSyllabusTextInput}
                    onChange={(e) => setCustomSyllabusTextInput(e.target.value)}
                    placeholder="Paste textbook table of contents or professor's syllabus..."
                    className="w-full px-3 py-2 rounded-xl bg-paper-surface-2 border border-paper-line text-xs focus:ring-1 focus:ring-terracotta focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-paper-text-dim hover:text-paper-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGeneratingSyllabus}
                    className="px-4 py-2 rounded-xl bg-terracotta text-white font-semibold text-xs hover:bg-terracotta-600 transition shadow-sm flex items-center space-x-1.5"
                  >
                    {isGeneratingSyllabus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Generate Curriculum Roadmap</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
