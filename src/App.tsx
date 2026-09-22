import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SetupWizard } from './components/setup/SetupWizard';
import { LoginPage } from './components/auth/LoginPage';
import { Shell } from './components/layout/Shell';
import { DashboardView } from './components/dashboard/DashboardView';
import { InstituteManagement } from './components/institute/InstituteManagement';
import { AcademicYearManagement } from './components/academic/AcademicYearManagement';
import { AcademicManagement } from './components/academic/AcademicManagement';
import { StudentManagement } from './components/students/StudentManagement';
import { TeacherManagement } from './components/teachers/TeacherManagement';
import { AttendanceView } from './components/attendance/AttendanceView';
import { ExaminationManagement } from './components/examination/ExaminationManagement';
import { FeeManagement } from './components/fees/FeeManagement';
import { QuickIdFeeCollection } from './components/fees/QuickIdFeeCollection';
import { AccountsManagement } from './components/accounts/AccountsManagement';
import { CertificateManagement } from './components/certificates/CertificateManagement';
import { IdCardManagement } from './components/idcards/IdCardManagement';
import { LibraryManagement } from './components/library/LibraryManagement';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { TransportManagement } from './components/transport/TransportManagement';
import { NoticeManagement } from './components/notices/NoticeManagement';
import { CalendarManagement } from './components/calendar/CalendarManagement';
import { UserManagement } from './components/users/UserManagement';
import { SettingsView } from './components/settings/SettingsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { ReportCenter } from './components/reports/ReportCenter';
import { BackupManagement } from './components/backup/BackupManagement';
import { VersionUpdaterView } from './components/updater/VersionUpdaterView';
import { ActionUndoManager } from './components/undo/ActionUndoManager';
import { GeminiChatView } from './components/chat/GeminiChatView';
import { Building2, Sparkles, ArrowLeft, ShieldAlert } from 'lucide-react';
import { ERPModule, ViewTab } from './types';

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

const AppContent: React.FC = () => {
  const { isReady, isInitialized, currentUser, currentRole, activeTab, setActiveTab, hasPermission, language } = useApp();

  // 1. Database & Context Loading Screen
  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs animate-pulse mb-4">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-base font-bold tracking-tight text-white">School &amp; College Management ERP</h1>
        <p className="text-xs text-slate-400 mt-1">
          Opening IndexedDB offline database engine...
        </p>
      </div>
    );
  }

  // 2. First-Time Setup Wizard (shown if DB has no institutes/admin)
  if (!isInitialized) {
    return <SetupWizard />;
  }

  // 3. Login Screen (if user not authenticated)
  if (!currentUser) {
    return <LoginPage />;
  }

  // 4. Main Application Views inside Shell
  const renderCurrentView = () => {
    // RBAC Route Guard: check if user has view permission for the selected module
    if (
      activeTab !== 'dashboard' &&
      currentRole?.id !== 'role_super_admin' &&
      currentRole?.id !== 'role_admin'
    ) {
      const requiredMod = TAB_MODULE_MAP[activeTab] || 'dashboard';
      if (!hasPermission(requiredMod, 'view')) {
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-8 text-center space-y-4 shadow-sm max-w-lg mx-auto my-12">
            <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'অনুমতি নেই / Access Restricted' : 'Access Restricted'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {language === 'bn'
                  ? `আপনার রোল (${currentRole?.bengaliName || currentRole?.name || 'ব্যবহারকারী'}) এই মডিউলে প্রবেশের অনুমতিপ্রাপ্ত নয়। অনুগ্রহ করে অ্যাডমিনিস্ট্রেটরের সাথে যোগাযোগ করুন।`
                  : `Your role (${currentRole?.name || 'User'}) does not have permission to access the ${requiredMod} module. Please contact your system administrator.`}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Return to Dashboard'}</span>
              </button>
            </div>
          </div>
        );
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'institute':
        return <InstituteManagement />;
      case 'academic_years':
        return <AcademicYearManagement />;
      case 'academic':
        return <AcademicManagement />;
      case 'students':
        return <StudentManagement />;
      case 'teachers':
        return <TeacherManagement />;
      case 'attendance':
        return <AttendanceView />;
      case 'examination':
        return <ExaminationManagement />;
      case 'fees':
        return <FeeManagement />;
      case 'quick-fees':
        return <QuickIdFeeCollection />;
      case 'accounts':
        return <AccountsManagement />;
      case 'certificates':
        return <CertificateManagement />;
      case 'idcards':
        return <IdCardManagement />;
      case 'library':
        return <LibraryManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'transport':
        return <TransportManagement />;
      case 'notices':
        return <NoticeManagement />;
      case 'calendar':
        return <CalendarManagement />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SettingsView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'reports':
        return <ReportCenter />;
      case 'backup':
        return <BackupManagement />;
      case 'version_updater':
        return <VersionUpdaterView />;
      case 'action_undo':
        return <ActionUndoManager />;
      case 'ai_chat':
        return <GeminiChatView />;
      default:
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-4 shadow-xs">
            <div className="w-10 h-10 mx-auto rounded-lg bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {String(activeTab).replace('_', ' ')} Module
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                This module is scheduled for the upcoming development phase in accordance with the Master Development Document.
              </p>
            </div>
            <div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return <Shell>{renderCurrentView()}</Shell>;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
