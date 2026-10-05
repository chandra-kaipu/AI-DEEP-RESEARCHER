import React from 'react';
import {
  Compass,
  Image as ImageIcon,
  BarChart3,
  BookOpenCheck,
  Globe2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GitFork,
} from 'lucide-react';
import { ActiveToolView } from '../types';

interface LeftSidebarProps {
  activeView: ActiveToolView;
  onSelectView: (view: ActiveToolView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: 'research' as ActiveToolView,
      label: 'Deep Research',
      description: 'Multi-source synthesis & mindmaps',
      icon: Compass,
      badge: 'Core',
    },
    {
      id: 'syllabus-hub' as ActiveToolView,
      label: 'Syllabus & Mindmaps',
      description: 'Curriculum roadmap & concept trees',
      icon: GitFork,
      badge: 'Student',
    },
    {
      id: 'image-studio' as ActiveToolView,
      label: 'AI Image Studio',
      description: 'Prompt-to-visual generation',
      icon: ImageIcon,
      badge: 'New',
    },
    {
      id: 'file-chart' as ActiveToolView,
      label: 'File-to-Chart',
      description: 'Excel, CSV, JSON data charts',
      icon: BarChart3,
      badge: 'New',
    },
    {
      id: 'text-explainer' as ActiveToolView,
      label: 'Deep Text Explainer',
      description: 'First-principles intellectual breakdown',
      icon: BookOpenCheck,
      badge: 'New',
    },
    {
      id: 'web-analyzer' as ActiveToolView,
      label: 'Web & Activity Audit',
      description: 'Live site scraping & AI intelligence',
      icon: Globe2,
      badge: 'New',
    },
  ];

  return (
    <aside
      className={`fixed top-16 left-0 bottom-0 z-30 transition-all duration-300 ease-in-out border-r border-[#1B2A32]/10 bg-[#FAF7F0]/90 backdrop-blur-md flex flex-col justify-between ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation List */}
      <div className="p-2 space-y-1">
        {!isCollapsed && (
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#1B2A32]/50 font-semibold flex items-center justify-between">
            <span>AI Tool Suite</span>
            <Sparkles className="w-3 h-3 text-[#D97757]" />
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              title={isCollapsed ? `${item.label} - ${item.description}` : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left group relative ${
                isActive
                  ? 'bg-[#D97757] text-white shadow-sm font-medium'
                  : 'text-[#1B2A32]/70 hover:bg-[#1B2A32]/5 hover:text-[#1B2A32]'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#1B2A32]/5 text-[#1B2A32]/70 group-hover:text-[#D97757] group-hover:bg-[#D97757]/10'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate leading-tight">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-medium ml-1 flex-shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badge === 'New'
                            ? 'bg-[#D97757]/15 text-[#D97757]'
                            : 'bg-[#1B2A32]/10 text-[#1B2A32]/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[10px] truncate leading-tight mt-0.5 ${
                      isActive ? 'text-white/80' : 'text-[#1B2A32]/50'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse / Expand Toggle at Bottom */}
      <div className="p-2 border-t border-[#1B2A32]/10 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-[11px] text-[#1B2A32]/50 font-mono pl-2">
            Active Mode
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`p-2 rounded-lg text-[#1B2A32]/60 hover:text-[#1B2A32] hover:bg-[#1B2A32]/5 transition-colors ${
            isCollapsed ? 'mx-auto' : 'ml-auto'
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
