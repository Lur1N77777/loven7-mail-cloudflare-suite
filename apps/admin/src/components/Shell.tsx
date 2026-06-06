import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, BarChart2, Check, ChevronDown, Database, Inbox, LayoutDashboard, Moon, MoreHorizontal, PenLine, RefreshCw, RotateCcw, Send, Settings, Shield, Sun, UserRoundCog, Users } from 'lucide-react';
import { STORAGE_KEYS } from '../lib/constants';
import { cls } from '../lib/format';
import { getLocaleShortLabel, getRuntimeLocale, localeText, toggleLocale, type AppLocale } from '../lib/locale';
import type { Statistics } from '../types/api';
import { HeroOrbitLogo } from './BrandIcons';

export type MenuKey = 'dashboard' | 'stats' | 'address' | 'users' | 'inbox' | 'sent' | 'unknown' | 'compose' | 'settings' | 'maintenance';

type MenuItem = { key: MenuKey; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> };

const menuGroups: Array<Array<MenuItem>> = [
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

const flatMenuItems = menuGroups.flat();
export const mobilePrimaryMenus: MenuKey[] = ['stats', 'address', 'inbox', 'sent'];
export const mobileSwipeMenus: MenuKey[] = [...mobilePrimaryMenus, 'dashboard'];
const mobilePrimaryMenuSet = new Set(mobilePrimaryMenus);
const mobilePrimaryItems = mobilePrimaryMenus.map((key) => flatMenuItems.find((item) => item.key === key)!);
const mobileMoreItems = flatMenuItems.filter((item) => !mobilePrimaryMenuSet.has(item.key));
const mobileNavSlotCount = mobilePrimaryItems.length + 1;

function getMobileNavSlotIndex(menu: MenuKey): number {
  const primaryIndex = mobilePrimaryMenus.indexOf(menu);
  return primaryIndex >= 0 ? primaryIndex : mobilePrimaryItems.length;
}

const adminAvatarPresets = [
  { id: 'aurora', src: 'https://img.loven7.com/file/img/IRup4u1h.webp', labelZh: '蓝发男工程师', labelEn: 'Blue male engineer' },
  { id: 'mint', src: 'https://img.loven7.com/file/img/AuYlfVVC.webp', labelZh: '绿衣男管理员', labelEn: 'Sage male admin' },
  { id: 'coral', src: 'https://img.loven7.com/file/img/UtZxQsag.webp', labelZh: '珊瑚女指挥官', labelEn: 'Coral female lead' },
  { id: 'plum', src: 'https://img.loven7.com/file/img/P1oQEWCG.webp', labelZh: '紫发女设计师', labelEn: 'Plum female designer' },
  { id: 'skyline', src: 'https://img.loven7.com/file/img/8wVBfPFn.webp', labelZh: '银发男分析师', labelEn: 'Silver male analyst' },
] as const;

type AdminAvatarPresetId = (typeof adminAvatarPresets)[number]['id'];
type AdminAvatarChoice = AdminAvatarPresetId | 'custom';

const DEFAULT_ADMIN_AVATAR: AdminAvatarPresetId = 'aurora';
const PROFILE_NAME_MAX_LENGTH = 24;

function isAdminAvatarPresetId(value: string | null): value is AdminAvatarPresetId {
  return adminAvatarPresets.some((preset) => preset.id === value);
}

function readStoredAvatarChoice(): AdminAvatarChoice {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_AVATAR;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.adminAvatarPreset);
    if (stored === 'custom') return 'custom';
    return isAdminAvatarPresetId(stored) ? stored : DEFAULT_ADMIN_AVATAR;
  } catch {
    return DEFAULT_ADMIN_AVATAR;
  }
}

function extractAvatarUrl(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/https?:\/\/[^\s<>"']+/i);
  return (match?.[0] || trimmed).replace(/[)\],，。]+$/, '');
}

function normalizeAvatarUrl(value: string) {
  const candidate = extractAvatarUrl(value);
  if (!candidate) return '';
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:') return '';
    return parsed.href;
  } catch {
    return '';
  }
}

function readStoredCustomAvatar() {
  if (typeof window === 'undefined') return '';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.adminAvatarCustom) || '';
    const normalized = normalizeAvatarUrl(stored);
    if (stored && !normalized) window.localStorage.removeItem(STORAGE_KEYS.adminAvatarCustom);
    return normalized;
  } catch {
    return '';
  }
}

function persistAvatarChoice(choice: AdminAvatarChoice) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.adminAvatarPreset, choice);
  } catch {
    // Local storage can be unavailable in strict browser privacy modes.
  }
}

function persistCustomAvatar(url: string) {
  if (typeof window === 'undefined') return;
  try {
    if (url) window.localStorage.setItem(STORAGE_KEYS.adminAvatarCustom, url);
    else window.localStorage.removeItem(STORAGE_KEYS.adminAvatarCustom);
  } catch {
    // Local storage can be unavailable in strict browser privacy modes.
  }
}

function normalizeProfileName(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, PROFILE_NAME_MAX_LENGTH);
}

function readStoredProfileName() {
  if (typeof window === 'undefined') return '';
  try {
    return normalizeProfileName(window.localStorage.getItem(STORAGE_KEYS.adminProfileName) || '');
  } catch {
    return '';
  }
}

function persistProfileName(name: string) {
  if (typeof window === 'undefined') return;
  try {
    if (name) window.localStorage.setItem(STORAGE_KEYS.adminProfileName, name);
    else window.localStorage.removeItem(STORAGE_KEYS.adminProfileName);
  } catch {
    // Local storage can be unavailable in strict browser privacy modes.
  }
}

const menuLabelsEn: Partial<Record<MenuKey, string>> = {
  dashboard: 'Dashboard',
  stats: 'Stats',
  address: 'Addresses',
  users: 'Users',
  inbox: 'Inbox',
  sent: 'Sent',
  unknown: 'Unknown',
  compose: 'Compose',
  settings: 'Settings',
  maintenance: 'Maintenance',
};

function menuLabel(item: { key: MenuKey; label: string }, locale: AppLocale) {
  return locale === 'en-US' ? menuLabelsEn[item.key] || item.label : item.label;
}

function localeToggleTitle(locale: AppLocale) {
  return locale === 'en-US' ? 'Switch to Chinese' : 'Switch to English';
}

function getApiHostLabel(apiBase?: string, locale: AppLocale = 'zh-CN') {
  if (!apiBase) return localeText('同源 Worker', 'Same-origin Worker', locale);
  try {
    return new URL(apiBase).hostname || localeText('自定义 API', 'Custom API', locale);
  } catch {
    return apiBase.replace(/^https?:\/\//, '').replace(/\/$/, '') || localeText('自定义 API', 'Custom API', locale);
  }
}

function getProfileInitial(apiBase?: string) {
  const host = getApiHostLabel(apiBase);
  const match = host.match(/[a-z0-9]/i);
  return match ? match[0].toUpperCase() : 'A';
}

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

export function Sidebar({ activeMenu, setActiveMenu, stats, theme, setTheme, locale, setLocale, refresh, apiBase, connected, children }: {
  activeMenu: MenuKey;
  setActiveMenu: (menu: MenuKey) => void;
  stats: Statistics;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  refresh: () => void;
  apiBase?: string;
  connected?: boolean;
  children?: React.ReactNode;
}) {
  const hostLabel = getApiHostLabel(apiBase, locale);
  const profileInitial = getProfileInitial(apiBase);
  const profileCardRef = useRef<HTMLDivElement | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarChoice, setAvatarChoice] = useState<AdminAvatarChoice>(() => readStoredAvatarChoice());
  const [customAvatar, setCustomAvatar] = useState(() => readStoredCustomAvatar());
  const [avatarUrlDraft, setAvatarUrlDraft] = useState(() => readStoredCustomAvatar());
  const [profileName, setProfileName] = useState(() => readStoredProfileName());
  const [profileNameDraft, setProfileNameDraft] = useState(() => readStoredProfileName());
  const [avatarNotice, setAvatarNotice] = useState('');
  const selectedPreset = adminAvatarPresets.find((preset) => preset.id === avatarChoice) || adminAvatarPresets[0];
  const isCustomAvatarActive = avatarChoice === 'custom' && !!customAvatar;
  const avatarSrc = isCustomAvatarActive ? customAvatar : selectedPreset.src;
  const defaultProfileName = locale === 'en-US' ? 'Admin' : '管理员';
  const displayProfileName = profileName || defaultProfileName;

  useEffect(() => {
    if (!avatarPickerOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (profileCardRef.current && !profileCardRef.current.contains(event.target as Node)) setAvatarPickerOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAvatarPickerOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [avatarPickerOpen]);

  const chooseAvatar = (choice: AdminAvatarChoice) => {
    if (choice === 'custom' && !customAvatar) return;
    setAvatarChoice(choice);
    persistAvatarChoice(choice);
    setAvatarNotice(locale === 'en-US' ? 'Avatar saved' : '头像已保存');
  };

  const resetAvatar = () => {
    setCustomAvatar('');
    setAvatarUrlDraft('');
    persistCustomAvatar('');
    chooseAvatar(DEFAULT_ADMIN_AVATAR);
  };

  const applyAvatarUrl = () => {
    const normalized = normalizeAvatarUrl(avatarUrlDraft);
    if (!normalized) {
      setAvatarNotice(locale === 'en-US' ? 'Use a valid HTTPS image URL' : '请填写有效的 HTTPS 图片链接');
      return;
    }
    setCustomAvatar(normalized);
    setAvatarUrlDraft(normalized);
    persistCustomAvatar(normalized);
    setAvatarChoice('custom');
    persistAvatarChoice('custom');
    setAvatarNotice(locale === 'en-US' ? 'Custom avatar applied' : '自定义头像已应用');
  };

  const applyProfileName = () => {
    const normalized = normalizeProfileName(profileNameDraft);
    setProfileName(normalized);
    setProfileNameDraft(normalized);
    persistProfileName(normalized);
    setAvatarNotice(normalized ? (locale === 'en-US' ? 'Profile name saved' : '名称已保存') : (locale === 'en-US' ? 'Default name restored' : '已恢复默认名称'));
  };

  return (
    <aside className="hidden h-full w-[272px] shrink-0 flex-col border-r border-slate-100 bg-[#F8FAFC] md:flex xl:w-[288px]">
      <div className="flex items-center gap-3 px-6 py-8"><Logo /><div><h1 className="brand-wordmark text-xl font-semibold text-slate-950">Loven7-Mail</h1><p className="text-xs text-slate-400">{locale === 'en-US' ? 'Cloudflare temp mail admin' : 'Cloudflare 临时邮箱后台'}</p></div></div>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
        {menuGroups.map((group, groupIndex) => <div className="space-y-1" key={groupIndex}>{group.map((item) => {
          const Icon = item.icon;
          const badge = item.key === 'inbox' ? stats.mailCount : item.key === 'sent' ? stats.sendMailCount : undefined;
          return <button key={item.key} onClick={() => setActiveMenu(item.key)} className={cls('sidebar-nav-item flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left', activeMenu === item.key ? 'sidebar-nav-active' : 'text-slate-600 hover:bg-white hover:text-slate-900')}><span className="flex min-w-0 items-center gap-3"><Icon size={20} className="shrink-0" /> <span className="truncate">{menuLabel(item, locale)}</span></span><span className="sidebar-badge-slot">{typeof badge === 'number' && badge > 0 && <span className="sidebar-badge rounded-full px-2.5 py-0.5 text-xs font-medium">{badge}</span>}</span></button>;
        })}</div>)}
      </div>
      <div className="p-4">
        <button onClick={() => setActiveMenu('compose')} className="sidebar-compose-btn mb-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-medium transition"><PenLine size={18} /> {locale === 'en-US' ? 'Compose' : '写邮件'}</button>
        <div ref={profileCardRef} className="admin-profile-card rounded-2xl bg-white p-3 shadow-sm">
          <button type="button" className={cls('admin-profile-row flex items-center gap-3', avatarPickerOpen && 'is-open')} onClick={() => setAvatarPickerOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={avatarPickerOpen}>
            <span className={cls('admin-profile-avatar flex h-10 w-10 items-center justify-center rounded-full font-semibold', !isCustomAvatarActive && 'admin-profile-avatar-preset')}>
              <img src={avatarSrc} alt="" draggable={false} />
              <span className="sr-only">{profileInitial}</span>
            </span>
            <span className="admin-profile-main min-w-0">
              <span className="admin-profile-name text-sm font-medium text-slate-800">{displayProfileName}</span>
              <span className="admin-profile-status truncate text-[11px] text-slate-400">{connected ? (locale === 'en-US' ? 'Connected' : '已连接') : (locale === 'en-US' ? 'Offline' : '未连接')} · {hostLabel}</span>
            </span>
            <ChevronDown size={16} className="admin-profile-chevron ml-auto text-slate-400" />
          </button>
          {avatarPickerOpen && (
            <div className="admin-avatar-popover" role="dialog" aria-label={locale === 'en-US' ? 'Choose avatar' : '选择头像'}>
              <div className="admin-avatar-popover-head">
                <span>{locale === 'en-US' ? 'Avatar' : '头像'}</span>
                <small>{locale === 'en-US' ? 'Presets or your own HTTPS image link' : '预设头像或自己的 HTTPS 图片链接'}</small>
              </div>
              <label className="admin-profile-name-block" htmlFor="admin-profile-name">
                <span>{locale === 'en-US' ? 'Display name' : '显示名称'}</span>
                <span className="admin-profile-name-row">
                  <input
                    id="admin-profile-name"
                    className="admin-profile-name-input"
                    value={profileNameDraft}
                    maxLength={PROFILE_NAME_MAX_LENGTH}
                    placeholder={defaultProfileName}
                    spellCheck={false}
                    onChange={(event) => setProfileNameDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        applyProfileName();
                      }
                    }}
                  />
                  <button type="button" className="admin-profile-name-apply" onClick={applyProfileName}><Check size={14} />{locale === 'en-US' ? 'Save' : '保存'}</button>
                </span>
              </label>
              <div className="admin-avatar-grid">
                {adminAvatarPresets.map((preset) => {
                  const active = avatarChoice !== 'custom' && avatarChoice === preset.id;
                  return (
                    <button key={preset.id} type="button" className={cls('admin-avatar-option admin-avatar-preset-option', active && 'active')} title={locale === 'en-US' ? preset.labelEn : preset.labelZh} aria-label={locale === 'en-US' ? preset.labelEn : preset.labelZh} onClick={() => chooseAvatar(preset.id)}>
                      <img src={preset.src} alt="" draggable={false} />
                      {active && <span className="admin-avatar-check"><Check size={10} /></span>}
                    </button>
                  );
                })}
                {customAvatar && (
                  <button type="button" className={cls('admin-avatar-option admin-avatar-custom-option', avatarChoice === 'custom' && 'active')} title={locale === 'en-US' ? 'Custom avatar' : '自定义头像'} aria-label={locale === 'en-US' ? 'Custom avatar' : '自定义头像'} onClick={() => chooseAvatar('custom')}>
                    <img src={customAvatar} alt="" draggable={false} />
                    {avatarChoice === 'custom' && <span className="admin-avatar-check"><Check size={10} /></span>}
                  </button>
                )}
              </div>
              <label className="admin-avatar-url-block" htmlFor="admin-avatar-url">
                <span>{locale === 'en-US' ? 'Avatar image URL' : '头像图片链接'}</span>
                <span className="admin-avatar-url-row">
                  <input
                    id="admin-avatar-url"
                    className="admin-avatar-url-input"
                    value={avatarUrlDraft}
                    placeholder="https://your-image-host.example/avatar.webp"
                    spellCheck={false}
                    onChange={(event) => setAvatarUrlDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        applyAvatarUrl();
                      }
                    }}
                  />
                  <button type="button" className="admin-avatar-url-apply" onClick={applyAvatarUrl}><Check size={14} />{locale === 'en-US' ? 'Apply' : '应用'}</button>
                </span>
              </label>
              <div className="admin-avatar-actions">
                <button type="button" className="admin-avatar-action" onClick={resetAvatar}><RotateCcw size={15} />{locale === 'en-US' ? 'Reset' : '默认'}</button>
              </div>
              {avatarNotice && <p className="admin-avatar-notice">{avatarNotice}</p>}
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button onClick={refresh} className="sidebar-mini-btn" title={locale === 'en-US' ? 'Refresh' : '刷新'}><RefreshCw size={15} />{locale === 'en-US' ? 'Refresh' : '刷新'}</button>
            <button onClick={() => setActiveMenu('settings')} className="sidebar-mini-btn" title={locale === 'en-US' ? 'Settings' : '系统设置'}><Settings size={15} />{locale === 'en-US' ? 'Settings' : '设置'}</button>
            {children}
          </div>
          <div className="theme-segmented-control mt-3"><button onClick={() => setTheme('light')} className={cls('theme-segmented-option', theme === 'light' ? 'active' : 'text-slate-500')}><Sun size={16} /> {locale === 'en-US' ? 'Light' : '浅色'}</button><button onClick={() => setTheme('dark')} className={cls('theme-segmented-option', theme === 'dark' ? 'active' : 'text-slate-500')}><Moon size={16} /> {locale === 'en-US' ? 'Dark' : '深色'}</button></div>
          <button type="button" className="locale-mode-toggle mt-2 w-full" title={localeToggleTitle(locale)} onClick={() => setLocale(toggleLocale(locale))}>
            <span>{locale === 'en-US' ? 'Language' : '界面语言'}</span>
            <strong>{locale === 'en-US' ? 'English' : '中文'}</strong>
            <em>{getLocaleShortLabel(toggleLocale(locale))}</em>
          </button>
        </div>
      </div>
    </aside>
  );
}

export function Header({ activeMenu, apiBase, locale }: {
  activeMenu: MenuKey; setActiveMenu: (menu: MenuKey) => void; query: string; setQuery: (query: string) => void; refresh: () => void; apiBase: string; locale: AppLocale;
}) {
  const titleMap: Record<MenuKey, string> = { dashboard: '仪表盘', stats: '统计', address: '地址管理', users: '用户管理', inbox: '收件箱', sent: '发件箱', unknown: '未知邮件', compose: '写邮件', settings: '系统设置', maintenance: '维护' };
  const activeLabel = locale === 'en-US' ? menuLabelsEn[activeMenu] || titleMap[activeMenu] : titleMap[activeMenu];
  return <span className="mobile-header sr-only">{activeLabel} · {apiBase || (locale === 'en-US' ? 'Same-origin Worker' : '同源 Worker')}</span>;
}

type MobileNavProps = {
  activeMenu: MenuKey;
  visualActiveMenu?: MenuKey;
  setActiveMenu: (menu: MenuKey) => void;
  locale: AppLocale;
  swipeTargetMenu?: MenuKey | null;
  swipeProgress?: number;
  settling?: boolean;
  settleMs?: number;
};

export function MobileNav({ activeMenu, visualActiveMenu, setActiveMenu, locale, swipeTargetMenu = null, swipeProgress = 0, settling = false, settleMs = 220 }: MobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const displayMenu = visualActiveMenu || activeMenu;
  const isMoreActive = moreOpen || !mobilePrimaryMenuSet.has(displayMenu);
  const clampedProgress = Math.max(0, Math.min(1, Number.isFinite(swipeProgress) ? swipeProgress : 0));
  const sourceIndex = getMobileNavSlotIndex(activeMenu);
  const targetIndex = getMobileNavSlotIndex(swipeTargetMenu || displayMenu);
  const settledIndex = getMobileNavSlotIndex(displayMenu);
  const indicatorIndex = swipeTargetMenu ? sourceIndex + (targetIndex - sourceIndex) * clampedProgress : settledIndex;
  const navStyle = {
    '--mobile-nav-slot-count': String(mobileNavSlotCount),
    '--mobile-nav-indicator-index': indicatorIndex.toFixed(4),
    '--mobile-nav-swipe-progress': clampedProgress.toFixed(4),
    '--mobile-nav-settle-ms': `${settleMs}ms`,
  } as React.CSSProperties;

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen]);

  const choose = (menu: MenuKey) => {
    setActiveMenu(menu);
    setMoreOpen(false);
  };

  return (
    <nav
      ref={rootRef}
      className={cls('mobile-nav fixed bottom-0 left-0 right-0 z-[80] flex h-[calc(62px+env(safe-area-inset-bottom))] items-center justify-around border-t px-2 pb-safe md:hidden', swipeTargetMenu && clampedProgress > 0.001 && 'mobile-nav-tracking', settling && 'mobile-nav-settling')}
      style={navStyle}
      aria-label={locale === 'en-US' ? 'Mobile navigation' : '移动端主导航'}
    >
      <span className="mobile-nav-progress-pill" aria-hidden="true" />
      {mobilePrimaryItems.map((item) => {
        const Icon = item.icon;
        const active = displayMenu === item.key;
        return <button key={item.key} onClick={() => choose(item.key)} className={cls('mobile-nav-item flex w-14 flex-col items-center gap-0.5', active && 'active')} aria-current={active ? 'page' : undefined}><Icon size={21} /><span className="text-[10px] font-medium">{menuLabel(item, locale)}</span></button>;
      })}
      <button type="button" onClick={() => setMoreOpen((current) => !current)} className={cls('mobile-nav-item flex w-14 flex-col items-center gap-0.5', isMoreActive && 'active')} aria-haspopup="menu" aria-expanded={moreOpen}>
        <MoreHorizontal size={21} />
        <span className="text-[10px] font-medium">{locale === 'en-US' ? 'More' : '更多'}</span>
      </button>
      {moreOpen && (
        <div className="mobile-more-menu" role="menu" aria-label={locale === 'en-US' ? 'More pages' : '更多页面'}>
          {mobileMoreItems.map((item) => {
            const Icon = item.icon;
            const active = activeMenu === item.key;
            return (
              <button key={item.key} type="button" role="menuitem" className={cls('mobile-more-item', active && 'active')} onClick={() => choose(item.key)}>
                <Icon size={17} />
                <span>{menuLabel(item, locale)}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}


export function CredentialButton({ onClick }: { onClick: () => void }) {
  const locale = getRuntimeLocale();
  return <button onClick={onClick} className="sidebar-mini-btn credential-button" aria-label={localeText('凭据设置', 'Credential settings', locale)}><Shield size={15} /><span className="credential-button-label">{localeText('凭据', 'Auth', locale)}</span></button>;
}
