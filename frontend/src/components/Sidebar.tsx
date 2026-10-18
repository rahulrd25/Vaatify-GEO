'use client';

import Image from 'next/image';
import { Sparkles, Search, BarChart3, FileText, Activity, SlidersHorizontal } from 'lucide-react';

export type NavTab = 'agent' | 'queries' | 'overview' | 'explorer' | 'drift' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  brandName?: string;
  queriesCount: number;
  alertsCount: number;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  queriesCount,
  alertsCount,
}: SidebarProps) {
  const navItems = [
    { id: 'agent' as NavTab, label: 'AI Copilot', icon: Sparkles },
    { id: 'queries' as NavTab, label: 'Target Queries', icon: Search, badge: queriesCount },
    { id: 'overview' as NavTab, label: 'Visibility Dashboard', icon: BarChart3 },
    { id: 'explorer' as NavTab, label: 'Citation Audit Log', icon: FileText },
    { id: 'drift' as NavTab, label: 'Drift & Alerts', icon: Activity, badge: alertsCount > 0 ? alertsCount : undefined },
    { id: 'settings' as NavTab, label: 'Brand & Competitors', icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand & Workspace Header */}
      <div className="px-4 py-3.5 border-b border-slate-200">
        <Image
          src="/logo.svg"
          alt="Vaatify GEO"
          width={136}
          height={34}
          priority
          className="h-8 w-auto object-contain"
        />
        <p className="text-[11px] text-slate-500 font-medium leading-tight mt-1.5">
          AI Search Visibility Platform
        </p>
      </div>


      {/* Navigation Links */}
      <nav className="p-2 space-y-0.5 flex-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-orange-50 text-orange-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconComponent className={`h-4 w-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isActive
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Box */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Engine Connectors</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 inline-block" />
            4 Active
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Perplexity • Claude • Gemini • ChatGPT
        </p>
      </div>
    </aside>
  );
}

