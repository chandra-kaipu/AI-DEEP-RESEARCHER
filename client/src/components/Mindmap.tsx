import React, { useMemo } from 'react';
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
import { GitFork, ZoomIn, AlertTriangle } from 'lucide-react';
import { MindmapNode as MindmapNodeType } from '../types';

interface MindmapProps {
  mindmap: MindmapNodeType | null;
  isMissingKey?: boolean;
  onOpenKeysModal: () => void;
}

export const Mindmap: React.FC<MindmapProps> = ({
  mindmap,
  isMissingKey = false,
  onOpenKeysModal,
}) => {
  // Convert hierarchical tree to React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!mindmap) return { nodes: [], edges: [] };

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Root node
    const rootId = 'root';
    flowNodes.push({
      id: rootId,
      position: { x: 300, y: 50 },
      data: {
        label: (
          <div className="p-3 bg-terracotta text-white rounded-xl shadow-paper-md text-center max-w-[220px]">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-85">Core Research Focal</div>
            <div className="font-serif font-bold text-sm leading-tight mt-0.5">{mindmap.label}</div>
          </div>
        ),
      },
      style: { border: 'none', background: 'transparent' },
    });

    const categories = mindmap.children || [];
    const numCats = categories.length;
    const catSpacing = 280;
    const startX = 300 - ((numCats - 1) * catSpacing) / 2;

    categories.forEach((cat, catIdx) => {
      const catId = `cat-${catIdx}`;
      const catX = startX + catIdx * catSpacing;
      const catY = 180;

      flowNodes.push({
        id: catId,
        position: { x: catX, y: catY },
        data: {
          label: (
            <div className="p-2.5 bg-paper-surface border-2 border-sage text-paper-text rounded-xl shadow-paper-sm text-center max-w-[200px]">
              <div className="text-[9px] uppercase font-semibold text-sage">Category Pillar</div>
              <div className="font-serif font-semibold text-xs leading-tight mt-0.5">{cat.label}</div>
            </div>
          ),
        },
        style: { border: 'none', background: 'transparent' },
      });

      flowEdges.push({
        id: `e-root-${catId}`,
        source: rootId,
        target: catId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#D97757', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#D97757' },
      });

      // Sub-details
      const details = cat.children || [];
      details.forEach((det, detIdx) => {
        const detId = `det-${catIdx}-${detIdx}`;
        const detX = catX - 40 + (detIdx % 2 === 0 ? -40 : 40);
        const detY = catY + 110 + detIdx * 65;

        flowNodes.push({
          id: detId,
          position: { x: detX, y: detY },
          data: {
            label: (
              <div className="p-2 bg-paper-surface-2 border border-paper-line text-paper-text rounded-lg shadow-paper-sm text-left max-w-[180px]">
                <div className="font-sans text-[11px] font-medium leading-snug">{det.label}</div>
                {det.summarySnippet && (
                  <div className="text-[9px] text-paper-text-dim mt-0.5 line-clamp-2">{det.summarySnippet}</div>
                )}
              </div>
            ),
          },
          style: { border: 'none', background: 'transparent' },
        });

        flowEdges.push({
          id: `e-${catId}-${detId}`,
          source: catId,
          target: detId,
          type: 'smoothstep',
          style: { stroke: '#8C9C7C', strokeWidth: 1.5 },
        });
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [mindmap]);

  if (isMissingKey) {
    return (
      <div className="bg-paper-surface rounded-2xl border border-dashed border-terracotta/40 p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-terracotta-50 flex items-center justify-center text-terracotta">
          <GitFork className="w-6 h-6" />
        </div>
        <h4 className="font-serif text-lg font-bold text-paper-text">
          Mindmap Synthesis Key Required
        </h4>
        <p className="text-sm text-paper-text-dim max-w-md mx-auto">
          Add <code className="bg-paper-surface-2 px-1.5 py-0.5 rounded text-terracotta font-mono">LLM_API_KEY</code> to automatically derive interactive hierarchical knowledge graphs.
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

  if (!mindmap) return null;

  return (
    <div className="bg-paper-surface rounded-2xl border border-paper-line shadow-paper-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-paper-line">
        <div className="flex items-center space-x-2">
          <GitFork className="w-5 h-5 text-terracotta" />
          <h3 className="font-serif text-xl font-bold text-paper-text">
            Hierarchical Mindmap
          </h3>
        </div>
        <div className="text-xs text-paper-text-dim flex items-center space-x-1">
          <ZoomIn className="w-3.5 h-3.5" />
          <span>Interactive Canvas &bull; Drag, Pan & Zoom</span>
        </div>
      </div>

      {/* React Flow Viewport */}
      <div className="h-[450px] w-full rounded-xl border border-paper-line overflow-hidden bg-paper-bg/40 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2.0}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--line)" />
          <Controls className="bg-paper-surface border border-paper-line shadow-paper-sm rounded-lg" />
        </ReactFlow>
      </div>
    </div>
  );
};
