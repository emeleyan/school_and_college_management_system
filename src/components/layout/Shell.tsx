import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewTab, ERPModule } from '../../types';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  Settings,
  FileText,
  GraduationCap,
  UserCheck,
  BookOpen,
  ClipboardCheck,
  Award,
  CreditCard,
  Receipt,
  Calculator,
  Library as LibraryIcon,
  Package,
  Bus,
  FileBadge,
  CreditCard as IdIcon,
  Bell,
  BarChart3,
  HardDrive,
  LogOut,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  Shield,
  Menu,
  X,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Info,
  RefreshCw,
  RotateCcw,
  FlaskConical,
  Lock,
  Unlock,
  Undo2,
} from 'lucide-react';
import { DemoDataManagerModal } from '../demo/DemoDataManagerModal';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const {
    activeInstitute,
    activeAcademicYear,
    institutes,
    academicYears,
    currentUser,
    currentRole,
    language,
    theme,
    activeTab,
    t,
    switchInstitute,
    switchAcademicYear,
    setActiveTab,
    setLanguage,
    setTheme,
    logout,
    hasPermission,
    backupReminder,
    dismissBackupReminder,
    isLiveMode,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [instituteDropdownOpen, setInstituteDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [dismissedReminder, setDismissedReminder] = useState(false);
  const [showArchInfoModal, setShowArchInfoModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  interface NavItem {
    id: ViewTab;
    module: ERPModule;
    label: string;
    icon: any;
    phase: number;
    active?: boolean;
    badge?: string;
  }

  interface NavGroup {
    groupTitle: string;
    items: NavItem[];
  }

  const TAB_MODULE_MAP: Record<ViewTab, ERPModule> = {
    dashboard: 'dashboard',
    institute: 'institute',
    academic_years: 'academic',
    academic: 'academic',
    students: 'students',
    teachers: 'teachers',
    attendance: 'attendance',
    examination: 'examination',
    fees: 'fees',
    'quick-fees': 'fees',
    accounts: 'accounts',
    certificates: 'certificates',
    idcards: 'idcards',
    library: 'library',
    inventory: 'inventory',
    transport: 'transport',
    notices: 'notices',
    calendar: 'calendar',
    reports: 'reports',
    users: 'users',
    audit_logs: 'audit',
    settings: 'settings',
    backup: 'backup',
    version_updater: 'settings',
    action_undo: 'fees',
    ai_chat: 'dashboard',
  };

  const isItemAuthorized = (tabId: ViewTab): boolean => {
    if (!currentUser) return false;
    if (tabId === 'dashboard') return true;
    if (currentRole?.id === 'role_super_admin' || currentRole?.id === 'role_admin') return true;

    const mod = TAB_MODULE_MAP[tabId] || 'dashboard';
    return hasPermission(mod, 'view');
  };

  // Navigation Items according to Section 16 & 142
  const navGroups: NavGroup[] = [
    {
      groupTitle: language === 'bn' ? 'প্রধান' : 'Core',
      items: [
        {
          id: 'dashboard' as ViewTab,
          module: 'dashboard',
          label: t.dashboard,
          icon: LayoutDashboard,
          phase: 1,
          active: true,
        },
        {
          id: 'institute' as ViewTab,
          module: 'institute',
          label: t.institute,
          icon: Building2,
          phase: 1,
          active: true,
        },
        {
          id: 'academic_years' as ViewTab,
          module: 'academic',
          label: language === 'bn' ? 'শিক্ষাবর্ষ ব্যবস্থাপনা' : 'Academic Years',
          icon: Calendar,
          phase: 1,
          active: true,
        },
        {
          id: 'ai_chat' as ViewTab,
          module: 'dashboard',
          label: language === 'bn' ? 'এআই চ্যাটবট (Gemini)' : 'AI Assistant (Gemini)',
          icon: Sparkles,
          phase: 1,
          active: true,
          badge: 'AI',
        },
      ],
    },
    {
      groupTitle: language === 'bn' ? 'একাডেমিক ও পরীক্ষা' : 'Academic & Exams',
      items: [
        {
          id: 'academic' as ViewTab,
          module: 'academic',
          label: t.academic,
          icon: BookOpen,
          phase: 2,
          active: true,
        },
        {
          id: 'students' as ViewTab,
          module: 'students',
          label: t.students,
          icon: GraduationCap,
          phase: 3,
          active: true,
        },
        {
          id: 'teachers' as ViewTab,
          module: 'teachers',
          label: t.teachers,
          icon: UserCheck,
          phase: 4,
          active: true,
        },
        {
          id: 'attendance' as ViewTab,
          module: 'attendance',
          label: t.attendance,
          icon: ClipboardCheck,
          phase: 5,
          active: true,
        },
        {
          id: 'examination' as ViewTab,
          module: 'examination',
          label: t.examination,
          icon: Award,
          phase: 6,
          active: true,
        },
      ],
    },
    {
      groupTitle: language === 'bn' ? 'হিসাব ও অর্থ' : 'Finance & Fees',
      items: [
        {
          id: 'quick-fees' as ViewTab,
          module: 'fees',
          label: language === 'bn' ? 'আইডি ফি কালেকশন' : 'Quick ID Fee Collection',
          icon: Receipt,
          phase: 7,
          active: true,
        },
        {
          id: 'fees' as ViewTab,
          module: 'fees',
          label: t.fees,
          icon: CreditCard,
          phase: 7,
          active: true,
        },
        {
          id: 'accounts' as ViewTab,
          module: 'accounts',
          label: t.accounts,
          icon: Calculator,
          phase: 8,
          active: true,
        },
        {
          id: 'action_undo' as ViewTab,
          module: 'fees',
          label: language === 'bn' ? 'নির্দিষ্ট কাজ আনডু' : 'Action Undo Hub',
          icon: RotateCcw,
          phase: 7,
          active: true,
          badge: 'UNDO',
        },
      ],
    },
    {
      groupTitle: language === 'bn' ? 'কাগজপত্র ও সম্পদ' : 'Docs & Operations',
      items: [
        {
          id: 'certificates' as ViewTab,
          module: 'certificates',
          label: t.certificates,
          icon: FileBadge,
          phase: 11,
          active: true,
        },
        {
          id: 'idcards' as ViewTab,
          module: 'idcards',
          label: t.idcards,
          icon: IdIcon,
          phase: 11,
          active: true,
        },
        {
          id: 'library' as ViewTab,
          module: 'library',
          label: t.library,
          icon: LibraryIcon,
          phase: 12,
          active: true,
        },
        {
          id: 'inventory' as ViewTab,
          module: 'inventory',
          label: t.inventory,
          icon: Package,
          phase: 12,
          active: true,
        },
        {
          id: 'transport' as ViewTab,
          module: 'transport',
          label: t.transport,
          icon: Bus,
          phase: 12,
          active: true,
        },
        {
          id: 'notices' as ViewTab,
          module: 'notices',
          label: t.notices,
          icon: Bell,
          phase: 12,
          active: true,
        },
        {
          id: 'calendar' as ViewTab,
          module: 'calendar',
          label: t.calendar,
          icon: Calendar,
          phase: 12,
          active: true,
        },
        {
          id: 'reports' as ViewTab,
          module: 'reports',
          label: t.reports,
          icon: BarChart3,
          phase: 13,
          active: true,
        },
      ],
    },
    {
      groupTitle: language === 'bn' ? 'প্রশাসন ও সিস্টেম' : 'Administration & System',
      items: [
        {
          id: 'users' as ViewTab,
          module: 'users',
          label: t.users,
          icon: Users,
          phase: 1,
          active: true,
        },
        {
          id: 'audit_logs' as ViewTab,
          module: 'audit',
          label: t.audit,
          icon: FileText,
          phase: 1,
          active: true,
        },
        {
          id: 'settings' as ViewTab,
          module: 'settings',
          label: t.settings,
          icon: Settings,
          phase: 1,
          active: true,
        },
        {
          id: 'backup' as ViewTab,
          module: 'backup',
          label: t.backup,
          icon: HardDrive,
          phase: 14,
          active: true,
        },
        {
          id: 'version_updater' as ViewTab,
          module: 'settings',
          label: language === 'bn' ? 'ভার্সন আপগ্রেডার' : 'Version Updater',
          icon: RefreshCw,
          phase: 15,
          active: true,
          badge: 'NEW',
        },
      ],
    },
  ];

  // RBAC Filtering: only show groups & items the current user has permission to view
  const visibleNavGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => isItemAuthorized(item.id)),
      }))
      .filter((group) => group.items.length > 0);
  }, [navGroups, currentUser, currentRole, hasPermission]);

  const handleNavClick = (item: { id: ViewTab; phase: number; active?: boolean }) => {
    if (!isItemAuthorized(item.id)) return;
    if (item.active || item.phase <= 2) {
      setActiveTab(item.id);
      setMobileMenuOpen(false);
    }
  };

  const isSchool = activeInstitute?.type === 'school';

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex overflow-hidden font-sans select-none transition-colors duration-200">
      {/* PROFESSIONAL POLISH DARK ASIDE / SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 hidden lg:flex flex-col border-r border-slate-800 transition-all duration-200 shrink-0 z-30`}
      >
        {/* Sidebar Header */}
        <div className="h-16 sm:h-20 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {activeInstitute?.logoUrl ? (
              <img
                src={activeInstitute.logoUrl}
                alt={`${activeInstitute.name} Logo`}
                className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-700 shadow-xs shrink-0"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                  isSchool ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
            )}
            {sidebarOpen && (
              <div className="overflow-hidden">
                <span className="text-white font-semibold tracking-tight text-sm block truncate">
                  {language === 'bn'
                    ? activeInstitute?.bengaliName || activeInstitute?.name || 'ইআরপি সিস্টেম'
                    : activeInstitute?.name || 'Education ERP'}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
                  {isSchool ? t.school : t.college} Edition
                </span>
              </div>
            )}
          </div>
          <button
            id="btn-toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-4">
          {visibleNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {sidebarOpen ? (
                <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  {group.groupTitle}
                </div>
              ) : (
                <div className="h-px bg-slate-800 my-2" />
              )}
              {group.items.map((item) => {
                const isCurrent = activeTab === item.id;
                const Icon = item.icon;
                const isAvailable = item.active || item.phase <= 2;

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleNavClick(item)}
                    disabled={!isAvailable}
                    title={!isAvailable ? `${item.label} (${item.badge})` : item.label}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-colors ${
                      isCurrent
                        ? 'bg-slate-800 text-white font-semibold shadow-xs'
                        : isAvailable
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium cursor-pointer'
                        : 'text-slate-600 opacity-40 cursor-not-allowed font-normal'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isCurrent ? 'text-blue-400' : isAvailable ? 'opacity-80' : 'opacity-40'
                      }`}
                    />
                    {sidebarOpen && (
                      <div className="flex-1 flex items-center justify-between text-left truncate">
                        <span className="truncate">{item.label}</span>
                        {!isAvailable && item.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 font-medium border border-slate-700/50">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / Current User Profile */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
              {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            {sidebarOpen && (
              <div className="ml-3 overflow-hidden flex-1">
                <p className="text-xs font-medium text-white truncate">
                  {currentUser?.fullName || 'Administrator'}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-semibold uppercase tracking-wider">
                  {currentRole?.name || 'Super Admin'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-slate-900 text-white h-full flex flex-col z-10 shadow-2xl overflow-y-auto p-4 space-y-4 border-r border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white text-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm tracking-tight text-white">
                  Navigation Menu
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {visibleNavGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2">
                  {group.groupTitle}
                </div>
                {group.items.map((item) => {
                  const isCurrent = activeTab === item.id;
                  const Icon = item.icon;
                  const isAvailable = item.active || item.phase <= 2;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      disabled={!isAvailable}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                        isCurrent
                          ? 'bg-slate-800 text-white font-semibold'
                          : isAvailable
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                          : 'text-slate-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {!isAvailable && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
        {/* TOPBAR / HEADER (Professional Polish) */}
        <header className="h-16 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-xs">
          {/* Left: Context Title & Metadata */}
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              id="btn-toggle-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden flex items-center justify-center transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {activeInstitute?.logoUrl && (
              <img
                src={activeInstitute.logoUrl}
                alt={`${activeInstitute.name} Logo`}
                className="w-10 h-10 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
              />
            )}

            <div className="overflow-hidden">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {language === 'bn'
                  ? activeInstitute?.bengaliName || activeInstitute?.name
                  : activeInstitute?.name || 'School & College ERP'}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-semibold truncate flex items-center gap-2">
                <span>EIIN: {activeInstitute?.eiin || 'N/A'}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>Session: {activeAcademicYear?.yearName || 'Active'}</span>
              </p>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Institute Switcher Segmented Control */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              {institutes.map((inst) => {
                const isSelected = inst.id === activeInstitute?.id;
                return (
                  <button
                    key={inst.id}
                    id={`topbar-switch-${inst.id}`}
                    onClick={() => switchInstitute(inst.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        inst.type === 'school' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                    />
                    <span>{inst.type === 'school' ? t.school : t.college}</span>
                  </button>
                );
              })}
            </div>

            {/* Academic Year Switcher */}
            <div className="relative">
              <button
                id="btn-year-switch"
                onClick={() => {
                  setYearDropdownOpen(!yearDropdownOpen);
                  setInstituteDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeAcademicYear?.yearName || 'Session'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {yearDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    {t.selectYear}
                  </div>
                  {academicYears.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400">No years configured</div>
                  ) : (
                    academicYears.map((yr) => {
                      const isSelected = yr.id === activeAcademicYear?.id;
                      return (
                        <button
                          key={yr.id}
                          id={`switch-to-year-${yr.id}`}
                          onClick={() => {
                            switchAcademicYear(yr.id);
                            setYearDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                            isSelected
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span>{yr.yearName}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold uppercase">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Demo / Live Mode Indicator & Quick Action */}
            <button
              id="btn-demo-mode-toggle"
              onClick={() => setShowDemoModal(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isLiveMode
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-700'
              }`}
              title={
                isLiveMode
                  ? language === 'bn'
                    ? 'লাইভ প্রোডাকশন মোড সক্রিয় (ডেমো ডাটা নিষ্ক্রিয়)'
                    : 'Live Mode: Demo seeding locked'
                  : language === 'bn'
                  ? 'টেস্টিং/ডেমো মোড সক্রিয় (ডেমো তৈরি বা ১-ক্লিকে মুছুন)'
                  : 'Demo Mode: Seed or 1-Click Purge'
              }
            >
              {isLiveMode ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">
                    {language === 'bn' ? 'লাইভ মোড' : 'Live Mode'}
                  </span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline">
                    {language === 'bn' ? 'ডেমো ও টেস্ট' : 'Demo & Test'}
                  </span>
                </>
              )}
            </button>

            {/* AI Assistant Quick Access Button */}
            <button
              id="btn-topbar-ai-chat"
              onClick={() => setActiveTab('ai_chat')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                activeTab === 'ai_chat'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-950/40 dark:to-indigo-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              }`}
              title="EduSphere AI Assistant (Gemini)"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">AI Assistant</span>
            </button>

            {/* Language Switcher (EN / বাংলা Segmented Toggle) */}
            <div
              id="lang-switcher-group"
              className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-xs"
              title="Switch Language / ভাষা পরিবর্তন করুন"
            >
              <button
                id="btn-lang-en"
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>EN</span>
              </button>
              <button
                id="btn-lang-bn"
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  language === 'bn'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>বাংলা</span>
              </button>
            </div>

            {/* Theme Switcher */}
            <button
              id="btn-theme-toggle"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors shadow-xs"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Logout Button */}
            <button
              id="btn-logout"
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors shadow-xs"
              title={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* SUB-HEADER STATUS STRIP */}
        <div className="h-8 bg-slate-100/80 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t.offlineStatus}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              {t.activeInstitute}:{' '}
              <strong className="text-slate-900 dark:text-slate-200">
                {activeInstitute?.name}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              Session:{' '}
              <strong className="text-slate-900 dark:text-slate-200">
                {activeAcademicYear?.yearName || 'None'}
              </strong>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            <button
              onClick={() => setShowArchInfoModal(true)}
              className="flex items-center gap-1.5 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium lowercase first-letter:uppercase"
              title="Learn about offline data persistence and multi-device handling"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Single-PC Offline Architecture</span>
            </button>
            <span>•</span>
            <span>IndexedDB Storage</span>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* STALE BACKUP REMINDER BANNER */}
            {backupReminder?.showReminder && !dismissedReminder && (
              <div
                id="stale-backup-banner"
                className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      {language === 'bn' ? 'সতর্কতা: ব্যাকআপ নেওয়া প্রয়োজন' : 'Action Recommended: Backup Required'}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                      {language === 'bn'
                        ? `গত ${backupReminder.daysSinceLastBackup} দিন ধরে কোনো ব্যাকআপ সংরক্ষণ করা হয়নি। ব্রাউজার বা ডিভাইসের ত্রুটি এড়াতে অবিলম্বে একটি নতুন ব্যাকআপ ডাউনলোড করুন।`
                        : `No database backup has been taken for ${backupReminder.daysSinceLastBackup} days. To protect your school records from browser cache loss, download a fresh backup now.`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab('backup');
                      setDismissedReminder(true);
                      dismissBackupReminder();
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    {language === 'bn' ? 'ব্যাকআপ নিন' : 'Take Backup Now'}
                  </button>
                  <button
                    onClick={() => {
                      setDismissedReminder(true);
                      dismissBackupReminder();
                    }}
                    className="px-2.5 py-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg text-xs font-medium transition-colors"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Dismiss'}
                  </button>
                </div>
              </div>
            )}

            {children}
          </div>
        </main>

        {/* ARCHITECTURE INFORMATION MODAL */}
        {showArchInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {language === 'bn' ? 'অফলাইন ও সিঙ্গেল-পিসি আর্কিটেকচার' : 'Single-PC Offline Architecture'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'bn' ? 'লোকাল ডেটা স্টোরেজ ও ট্রান্সফার নির্দেশিকা' : 'Local Data Storage & Multi-Device Transfer Guide'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowArchInfoModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    {language === 'bn' ? '🔒 ডেটা কোথায় সংরক্ষিত হয়?' : '🔒 Where is data stored?'}
                  </span>
                  <p>
                    {language === 'bn'
                      ? 'সকল ডেটা আপনার এই কম্পিউটারের ব্রাউজারের IndexedDB ডেটাবেজে সম্পূর্ণ গোপনীয় ও এনক্রিপ্ট অবস্থায় সংরক্ষিত থাকে। কোনো দূরবর্তী ক্লাউড বা তৃতীয় পক্ষের সার্ভারে কোনো তথ্য পাঠানো হয় না।'
                      : 'All records, financial entries, and student profiles are stored strictly inside your local browser’s IndexedDB engine on this computer. Zero data is transmitted to external cloud servers.'}
                  </p>
                </div>

                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40">
                  <span className="font-semibold text-blue-900 dark:text-blue-200 block mb-1">
                    {language === 'bn' ? '🔄 অন্য কম্পিউটার বা ডিভাইসে কিভাবে তথ্য নেবেন?' : '🔄 How to transfer data to another computer?'}
                  </span>
                  <p>
                    {language === 'bn'
                      ? 'অন্য কম্পিউটারে ডেটা নিতে চাইলে "Backup & Restore" মডিউলে গিয়ে এনক্রিপ্টেড ব্যাকআপ (.json / .enc) ডাউনলোড করুন এবং পেনড্রাইভ দিয়ে অন্য পিসিতে নিয়ে "Restore Backup" করুন।'
                      : 'Because this is a secure offline application, direct background auto-sync between two separate computers does not exist. To move data, create an Encrypted Backup from the Backup & Restore module, transfer via USB or LAN, and restore it on the target PC.'}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
                  <span className="font-semibold text-amber-900 dark:text-amber-200 block mb-1">
                    {language === 'bn' ? '⚠️ জরুরি সতর্কতা:' : '⚠️ Important Maintenance:'}
                  </span>
                  <p>
                    {language === 'bn'
                      ? 'ব্রাউজারের হিস্ট্রি বা সাইট ডেটা ক্লিয়ার করলে যেন কোনো ক্ষতি না হয়, সেজন্য সপ্তাহে অন্তত একবার ব্যাকআপ ডাউনলোড করে আলাদা ফোল্ডারে রাখুন।'
                      : 'Regularly download a backup (weekly or bi-weekly) to protect against accidental browser cache clearance or device failure.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowArchInfoModal(false)}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  {language === 'bn' ? 'বুঝেছি' : 'Got it'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEMO DATA & LIVE MODE CONTROLLER MODAL */}
        <DemoDataManagerModal
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
        />

        {/* PROFESSIONAL POLISH FOOTER */}
        <footer className="h-11 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-widest shrink-0">
          <span>&copy; 2026 School &amp; College Management ERP Systems</span>
          <div className="flex items-center space-x-6">
            <span className="hidden sm:inline">Server: Localhost (IndexedDB)</span>
            <span>System Status: Optimal</span>
            <span className="text-emerald-500 flex items-center gap-1 font-bold">● Live</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
