import React from 'react';
import { AlertCircle, BarChart2, ChevronDown, Inbox, LayoutDashboard, Moon, MoreHorizontal, PenLine, RefreshCw, Send, Settings, Shield, Sun, UserRoundCog, Users, Database } from 'lucide-react';
import { cls } from '../lib/format';
import type { Statistics } from '../types/api';
import { HeroOrbitLogo } from './BrandIcons';

export type MenuKey = 'dashboard' | 'stats' | 'address' | 'users' | 'inbox' | 'sent' | 'unknown' | 'compose' | 'settings' | 'maintenance';

const menuGroups: Array<Array<{ key: MenuKey; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }>> = [
  [
    { key: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
    { key: 'stats', label: '统计', icon: BarChart2 },
    { key: 'address', label: '地址管理', icon: Users },
    { key: 'users', label: '用户管理', icon: UserRoundCog },
  ],
  [
    { key: 'inbox', label: '收件箱', icon: Inbox },
    { key: 'sent', label: '发件箱', icon: Send },
    { key: 'unknown', label: '未知邮件', icon: AlertCircle },
    { key: 'compose', label: '写邮件', icon: PenLine },
  ],
  [
    { key: 'settings', label: '系统设置', icon: Settings },
    { key: 'maintenance', label: '维护', icon: Database },
  ],
];

function BrandGlyph({ className = 'h-7 w-7' }: { className?: string }) {
  return <HeroOrbitLogo className={cls('logo-mark logo-sigil', className)} />;
}

export function Logo() {
  return (
    <div className="logo-tile flex h-10 w-10 items-center justify-center" aria-hidden="true">
      <BrandGlyph />
    </div>
  );
}

export function Sidebar({ activeMenu, setActiveMenu, stats, theme, setTheme, refresh, children }: {
  activeMenu: MenuKey;
  setActiveMenu: (menu: MenuKey) => void;
  stats: Statistics;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  refresh: () => void;
  children?: React.ReactNode;
}) {
  return (
    <aside className="hidden h-full w-[272px] shrink-0 flex-col border-r border-slate-100 bg-[#F8FAFC] md:flex xl:w-[288px]">
      <div className="flex items-center gap-3 px-6 py-8"><Logo /><div><h1 className="brand-wordmark text-xl font-semibold text-slate-950">Loven7-Mail</h1><p className="text-xs text-slate-400">Cloudflare 临时邮箱后台</p></div></div>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
        {menuGroups.map((group, groupIndex) => <div className="space-y-1" key={groupIndex}>{group.map((item) => {
          const Icon = item.icon;
          const badge = item.key === 'inbox' ? stats.mailCount : item.key === 'sent' ? stats.sendMailCount : undefined;
          return <button key={item.key} onClick={() => setActiveMenu(item.key)} className={cls('sidebar-nav-item flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left', activeMenu === item.key ? 'sidebar-nav-active' : 'text-slate-600 hover:bg-white hover:text-slate-900')}><span className="flex min-w-0 items-center gap-3"><Icon size={20} className="shrink-0" /> <span className="truncate">{item.label}</span></span><span className="sidebar-badge-slot">{typeof badge === 'number' && badge > 0 && <span className="sidebar-badge rounded-full px-2.5 py-0.5 text-xs font-medium">{badge}</span>}</span></button>;
        })}</div>)}
      </div>
      <div className="p-4">
        <button onClick={() => setActiveMenu('compose')} className="sidebar-compose-btn mb-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-medium transition"><PenLine size={18} /> 写邮件</button>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-800">A</div><div className="min-w-0"><p className="text-sm font-medium text-slate-800">管理员</p><p className="truncate text-[11px] text-slate-400">Admin Session</p></div><ChevronDown size={16} className="ml-auto text-slate-400" /></div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button onClick={refresh} className="sidebar-mini-btn" title="刷新"><RefreshCw size={15} />刷新</button>
            <button onClick={() => setActiveMenu('settings')} className="sidebar-mini-btn" title="系统设置"><Settings size={15} />设置</button>
            {children}
          </div>
          <div className="mt-3 flex rounded-xl bg-slate-100 p-1"><button onClick={() => setTheme('light')} className={cls('flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm', theme === 'light' ? 'bg-white font-medium shadow-sm' : 'text-slate-500')}><Sun size={16} /> 浅色</button><button onClick={() => setTheme('dark')} className={cls('flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm', theme === 'dark' ? 'bg-white font-medium shadow-sm' : 'text-slate-500')}><Moon size={16} /> 深色</button></div>
        </div>
      </div>
    </aside>
  );
}

export function Header({ activeMenu, apiBase, children }: {
  activeMenu: MenuKey; setActiveMenu: (menu: MenuKey) => void; query: string; setQuery: (query: string) => void; refresh: () => void; apiBase: string; children?: React.ReactNode;
}) {
  const titleMap: Record<MenuKey, string> = { dashboard: '仪表盘', stats: '统计', address: '地址管理', users: '用户管理', inbox: '收件箱', sent: '发件箱', unknown: '未知邮件', compose: '写邮件', settings: '系统设置', maintenance: '维护' };
  return (
    <div className="mobile-header flex h-12 w-full items-center justify-between px-3 md:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="mobile-logo-tile flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden="true"><BrandGlyph className="h-[24px] w-[24px]" /></div>
        <div className="min-w-0">
          <span className="brand-wordmark block truncate text-[15px] font-semibold leading-4 text-slate-950">Loven7-Mail</span>
          <span className="block truncate text-[10px] leading-4 text-slate-400">{titleMap[activeMenu]} · {apiBase || '同源 Worker'}</span>
        </div>
      </div>
      {children && <div className="mobile-credential-slot shrink-0">{children}</div>}
    </div>
  );
}

export function MobileNav({ activeMenu, setActiveMenu }: { activeMenu: MenuKey; setActiveMenu: (menu: MenuKey) => void }) {
  const items: Array<{ key: MenuKey; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }> = [
    { key: 'stats', label: '统计', icon: BarChart2 }, { key: 'address', label: '地址', icon: Users }, { key: 'inbox', label: '收件箱', icon: Inbox }, { key: 'sent', label: '发件箱', icon: Send }, { key: 'settings', label: '更多', icon: MoreHorizontal },
  ];
  return <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-[80] flex h-[calc(62px+env(safe-area-inset-bottom))] items-center justify-around border-t px-2 pb-safe md:hidden">{items.map((item) => { const Icon = item.icon; const active = activeMenu === item.key; return <button key={item.key} onClick={() => setActiveMenu(item.key)} className={cls('mobile-nav-item flex w-14 flex-col items-center gap-0.5', active && 'active')}><Icon size={21} /><span className="text-[10px] font-medium">{item.label}</span></button>; })}</nav>;
}

export function CredentialButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="sidebar-mini-btn credential-button" aria-label="凭据设置"><Shield size={15} /><span className="credential-button-label">凭据</span></button>;
}
