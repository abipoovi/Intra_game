import React from 'react';
import { MessageSquare, FolderSearch, Award, FileText, ChevronRight, ShieldAlert } from 'lucide-react';
import { TabType } from '../types/game';
import { playClick } from '../utils/audio';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unlockedCluesCount: number;
  confessionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unlockedCluesCount,
  confessionsCount,
}) => {
  const tabs = [
    {
      id: 'briefing' as TabType,
      label: 'Case Briefing',
      tamil: 'வழக்கு விவரம்',
      icon: FileText,
      badge: null,
    },
    {
      id: 'interrogation' as TabType,
      label: 'Interrogation Room',
      tamil: 'விசாரணை அறை',
      icon: MessageSquare,
      badge: confessionsCount > 0 ? `${confessionsCount} Confessions` : null,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
    {
      id: 'evidence' as TabType,
      label: 'Evidence Locker',
      tamil: 'ஆதார பெட்டகம்',
      icon: FolderSearch,
      badge: `${unlockedCluesCount}/3 Viewed`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'resolution' as TabType,
      label: 'Case Resolution',
      tamil: 'வழக்கு முடிவு',
      icon: Award,
      badge: 'Submit Report',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-xl space-y-1">
        <div className="px-3 py-2 text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-500">
          INVESTIGATION TERMINAL
        </div>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playClick();
                setActiveTab(tab.id);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer group ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                  : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-zinc-950 text-amber-400'
                      : 'bg-zinc-950/60 text-zinc-400 group-hover:text-amber-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-wide">{tab.label}</div>
                  <div
                    className={`text-[10px] ${
                      isActive ? 'text-zinc-900 font-medium' : 'text-zinc-500'
                    }`}
                  >
                    {tab.tamil}
                  </div>
                </div>
              </div>

              {tab.badge && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-zinc-950 text-amber-400 border-zinc-800'
                      : tab.badgeColor
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Case Quick Status Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-400">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>MISSION OBJECTIVE</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
          Interrogate Vicky, Divya, and Perumal. Locate the motive, extract confessions, and identify the culprit pair and key physical evidence before the timer expires.
        </p>
      </div>
    </aside>
  );
};
