'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Sparkles, Search, BarChart3, FileText, Activity, SlidersHorizontal, LogOut, Settings, MoreVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type NavTab = 'agent' | 'queries' | 'overview' | 'explorer' | 'drift' | 'settings' | 'user_settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  brandName?: string;
  queriesCount: number;
  alertsCount: number;
  onboardingCompleted?: boolean;
  onOpenOnboarding?: () => void;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  queriesCount,
  alertsCount,
  onboardingCompleted,
  onOpenOnboarding,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'agent' as NavTab, label: 'AI Copilot', icon: Sparkles },
    { id: 'queries' as NavTab, label: 'Target Queries', icon: Search, badge: queriesCount },
    { id: 'overview' as NavTab, label: 'Visibility Dashboard', icon: BarChart3 },
    { id: 'explorer' as NavTab, label: 'Citation Audit Log', icon: FileText },
    { id: 'drift' as NavTab, label: 'Drift & Alerts', icon: Activity, badge: alertsCount > 0 ? alertsCount : undefined },
    { id: 'settings' as NavTab, label: 'Brand & Competitors', icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
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
      <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto">
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

        {/* Brand setup prompt if onboarding not completed */}
        {!onboardingCompleted && onOpenOnboarding && (
          <div className="mt-4 p-2.5 bg-orange-50/80 border border-orange-200 rounded text-left">
            <div className="flex items-center gap-1.5 text-[#FE4D03] font-semibold text-xs mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Brand Setup</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight mb-2">
              Configure your domain, competitors & target queries.
            </p>
            <button
              onClick={onOpenOnboarding}
              className="w-full py-1.5 px-2 bg-[#FE4D03] hover:bg-[#e04402] text-white text-[11px] font-semibold rounded cursor-pointer transition-colors shadow-2xs text-center"
            >
              Resume Setup (3 steps) →
            </button>
          </div>
        )}
      </nav>

      {/* Bottom User Bar */}
      {user && (
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0 relative" ref={menuRef}>
          {/* Popover Menu inside round settings/account icon */}
          {menuOpen && (
            <div className="absolute bottom-full left-3 mb-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-50 text-xs animate-fadeIn">
              <div className="px-2.5 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800 truncate" title={user.email}>
                  {user.email}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  {user.isWorkEmail ? 'Company Account' : 'Standard Account'}
                </p>
              </div>
              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    onSelectTab('user_settings');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors cursor-pointer text-left"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-500" />
                  <span>User Settings</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onSelectTab('user_settings')}
              className={`flex items-center gap-2.5 p-1 -m-1 rounded-lg transition-colors group cursor-pointer focus:outline-hidden text-left ${
                currentTab === 'user_settings'
                  ? 'bg-orange-50 text-orange-900 font-semibold'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="User Settings"
            >
              <div className="h-8 w-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs transition-colors">
                {user.email ? user.email[0].toUpperCase() : <Settings className="h-4 w-4" />}
              </div>
              <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
                Settings
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded cursor-pointer transition-colors"
              title="Account Menu"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

