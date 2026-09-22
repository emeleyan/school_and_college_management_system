import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Institute,
  InstituteHeadRole,
  AcademicYear,
  User,
  Role,
  AppSettings,
  ViewTab,
  ERPModule,
  PermissionAction,
} from '../types';
import {
  getDB,
  getAll,
  get,
  add,
  update,
  hashPassword,
  verifyPassword,
  isSystemInitialized,
  initializeDefaults,
  createAuditLog,
} from '../db/indexedDB';
import { translations, Language } from '../i18n/translations';
import { seedStandardCurriculum } from '../db/seedAcademicData';
import { checkAndTriggerAutoBackup, startMidnightAutoBackupScheduler } from '../utils/backupService';
import { setSystemLiveMode } from '../utils/demoDataService';

interface AppContextType {
  // Initialization & Auth
  isReady: boolean;
  isInitialized: boolean;
  currentUser: User | null;
  currentRole: Role | null;

  // Live Production vs Testing/Demo Mode
  isLiveMode: boolean;
  setIsLiveMode: (isLive: boolean) => Promise<void>;

  // Active Contexts
  activeInstitute: Institute | null;
  activeAcademicYear: AcademicYear | null;
  institutes: Institute[];
  academicYears: AcademicYear[];
  roles: Role[];
  settings: AppSettings | null;

  // Preferences & UI
  language: Language;
  theme: 'light' | 'dark';
  activeTab: ViewTab;
  t: typeof translations.en;

  // Backup Reminder
  backupReminder: {
    daysSinceLastBackup: number;
    showReminder: boolean;
    lastBackupDate?: string;
  } | null;
  dismissBackupReminder: () => void;
  triggerAutoBackupCheck: () => Promise<void>;

  // Actions
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchInstitute: (instituteId: string) => Promise<void>;
  switchAcademicYear: (yearId: string) => Promise<void>;
  setActiveTab: (tab: ViewTab) => void;
  setLanguage: (lang: Language) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  hasPermission: (module: ERPModule, action: PermissionAction) => boolean;
  logAudit: (
    action: string,
    module: ERPModule | 'auth' | 'setup' | 'system',
    details: string,
    recordId?: string
  ) => Promise<void>;
  refreshContext: () => Promise<void>;
  completeSetupWizard: (setupData: {
    adminUser: {
      username: string;
      password: string;
      fullName: string;
      email?: string;
      mobile?: string;
    };
    school: {
      name: string;
      bengaliName: string;
      eiin: string;
      address: string;
      phone: string;
      email: string;
      principalName: string;
      establishedYear: string;
      motto: string;
      logoUrl?: string;
      headRole?: InstituteHeadRole;
      headTitle?: string;
      headTitleBengali?: string;
      signatureUrl?: string;
    };
    college: {
      name: string;
      bengaliName: string;
      eiin: string;
      address: string;
      phone: string;
      email: string;
      principalName: string;
      vicePrincipalName?: string;
      actingPrincipalName?: string;
      establishedYear: string;
      motto: string;
      logoUrl?: string;
      headRole?: InstituteHeadRole;
      headTitle?: string;
      headTitleBengali?: string;
      signatureUrl?: string;
      viceSignatureUrl?: string;
      actingSignatureUrl?: string;
    };
    initialYears: string[]; // e.g. ['2025', '2026', '2027']
    activeYear: string; // e.g. '2026'
  }) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  INSTITUTE: 'erp_last_institute_id',
  ACADEMIC_YEAR: 'erp_last_year_id',
  USER_SESSION: 'erp_current_user_id',
  LANG: 'erp_language_pref',
  THEME: 'erp_theme_pref',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [activeInstitute, setActiveInstitute] = useState<Institute | null>(null);
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYear | null>(null);

  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || 'en'
  );
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light'
  );
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [isLiveMode, setIsLiveModeState] = useState<boolean>(() => {
    return localStorage.getItem('erp_go_live_mode') === 'true';
  });

  const setIsLiveMode = useCallback(
    async (isLive: boolean) => {
      setIsLiveModeState(isLive);
      await setSystemLiveMode(
        isLive,
        currentUser ? { id: currentUser.id, username: currentUser.username } : undefined
      );
      const loadedSettings = await get<AppSettings>('settings', 'global');
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    },
    [currentUser]
  );

  const [backupReminder, setBackupReminder] = useState<{
    daysSinceLastBackup: number;
    showReminder: boolean;
    lastBackupDate?: string;
  } | null>(null);

  const t = translations[language] || translations.en;

  const refreshPromiseRef = React.useRef<Promise<void> | null>(null);

  const triggerAutoBackupCheck = useCallback(async () => {
    try {
      const res = await checkAndTriggerAutoBackup(
        currentUser ? { id: currentUser.id, username: currentUser.username } : undefined
      );
      setBackupReminder({
        daysSinceLastBackup: res.daysSinceLastBackup,
        showReminder: res.daysSinceLastBackup >= 3,
        lastBackupDate: res.lastBackupDate,
      });

      // Start or resume 11:59 PM Midnight Auto-Backup background timer
      startMidnightAutoBackupScheduler(
        currentUser ? { id: currentUser.id, username: currentUser.username } : undefined
      );
    } catch (err) {
      console.warn('Backup check encountered an issue:', err);
    }
  }, [currentUser]);

  const dismissBackupReminder = useCallback(() => {
    setBackupReminder((prev) => (prev ? { ...prev, showReminder: false } : null));
  }, []);

  // Initialize DB and load active states
  const refreshContext = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const runRefresh = async () => {
      try {
        await getDB();
        await initializeDefaults();

        const initialized = await isSystemInitialized();
        setIsInitialized(initialized);

        const allRoles = await getAll<Role>('roles');
        setRoles(allRoles);

        const loadedSettings = await get<AppSettings>('settings', 'global');
        if (loadedSettings) {
          setSettings(loadedSettings);
          if (loadedSettings.isLiveMode !== undefined) {
            setIsLiveModeState(loadedSettings.isLiveMode);
          }
        }

        if (initialized) {
          const allInstitutes = await getAll<Institute>('institutes');
          setInstitutes(allInstitutes);

          // Resume or restore saved session
          const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
          let activeUser = currentUser;
          if (savedUserId && !activeUser) {
            const userObj = await get<User>('users', savedUserId);
            if (userObj && userObj.status === 'active') {
              activeUser = userObj;
              setCurrentUser(userObj);
              const userRole = allRoles.find((r) => r.id === userObj.roleId) || null;
              setCurrentRole(userRole);
            }
          }

          // Active institute resolution
          let selectedInst: Institute | null = null;
          const savedInstId = localStorage.getItem(STORAGE_KEYS.INSTITUTE);
          const targetInstId = savedInstId || activeInstitute?.id;
          if (targetInstId && allInstitutes.some((i) => i.id === targetInstId)) {
            selectedInst = allInstitutes.find((i) => i.id === targetInstId) || allInstitutes[0];
          } else if (allInstitutes.length > 0) {
            selectedInst = allInstitutes[0];
          }
          setActiveInstitute(selectedInst);

          // Active academic years resolution
          if (selectedInst) {
            let allYears = await getAll<AcademicYear>('academicYears');

            // Auto-heal / standardize college sessions if selected institute is college
            if (selectedInst.type === 'college') {
              const collegeYears = allYears.filter(
                (y) => y.instituteId === selectedInst!.id || y.instituteId === 'both'
              );
              const hasHyphenatedSession = collegeYears.some((y) => y.yearName.includes('-'));
              if (!hasHyphenatedSession) {
                // Seed standard college sessions 2025-26 and 2026-27
                const col2526: AcademicYear = {
                  id: `year_col_2025_26_${Date.now()}`,
                  instituteId: selectedInst.id,
                  yearName: '2025-26',
                  startDate: '2025-07-01',
                  endDate: '2026-06-30',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                const col2627: AcademicYear = {
                  id: `year_col_2026_27_${Date.now() + 1}`,
                  instituteId: selectedInst.id,
                  yearName: '2026-27',
                  startDate: '2026-07-01',
                  endDate: '2027-06-30',
                  isActive: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                await add('academicYears', col2526);
                await add('academicYears', col2627);
                allYears = await getAll<AcademicYear>('academicYears');
              }
            }

            const instYears = allYears.filter(
              (y) => y.instituteId === selectedInst!.id || y.instituteId === 'both'
            );
            setAcademicYears(instYears);

            const savedYearId = localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEAR);
            let chosenYear = instYears.find((y) => y.id === savedYearId);
            if (!chosenYear) {
              chosenYear = instYears.find((y) => y.isActive) || instYears[0] || null;
            }
            setActiveAcademicYear(chosenYear);
          }
        }
      } catch (err) {
        console.error('Error during context refresh:', err);
      } finally {
        setIsReady(true);
        refreshPromiseRef.current = null;
      }
    };

    refreshPromiseRef.current = runRefresh();
    return refreshPromiseRef.current;
  }, [currentUser, activeInstitute]);

  useEffect(() => {
    refreshContext();
  }, []);

  // Theme application
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Login handler
  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const allUsers = await getAll<User>('users');
      const user = allUsers.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!user) {
        return { success: false, message: 'Invalid username or password' };
      }

      if (user.status !== 'active') {
        return { success: false, message: 'Account is deactivated. Please contact Administrator.' };
      }

      const verifyResult = await verifyPassword(password, user.passwordHash);
      if (!verifyResult.valid) {
        return { success: false, message: 'Invalid username or password' };
      }

      // If user had legacy unsalted hash, transparently upgrade to PBKDF2
      let newHash = user.passwordHash;
      if (verifyResult.needsUpgrade) {
        newHash = await hashPassword(password);
      }

      // Update user login stats
      const updatedUser: User = {
        ...user,
        passwordHash: newHash,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await update('users', updatedUser);

      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, updatedUser.id);

      const allRoles = await getAll<Role>('roles');
      const role = allRoles.find((r) => r.id === updatedUser.roleId) || null;
      setCurrentRole(role);

      // Verify institute access
      const allInstitutes = await getAll<Institute>('institutes');
      let accessibleInst = allInstitutes[0];
      if (Array.isArray(updatedUser.instituteAccess)) {
        accessibleInst =
          allInstitutes.find((i) => updatedUser.instituteAccess.includes(i.id)) || allInstitutes[0];
      }
      if (accessibleInst) {
        setActiveInstitute(accessibleInst);
        localStorage.setItem(STORAGE_KEYS.INSTITUTE, accessibleInst.id);
      }

      await createAuditLog(
        'LOGIN',
        'auth',
        `User ${updatedUser.username} logged in successfully`,
        updatedUser.id,
        updatedUser.username,
        undefined,
        accessibleInst?.id
      );

      await refreshContext();
      // Trigger background check for scheduled auto backup and backup reminders
      setTimeout(() => {
        triggerAutoBackupCheck();
      }, 500);

      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Authentication failed' };
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    if (currentUser) {
      await createAuditLog(
        'LOGOUT',
        'auth',
        `User ${currentUser.username} logged out`,
        currentUser.id,
        currentUser.username,
        undefined,
        activeInstitute?.id
      );
    }
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    setCurrentUser(null);
    setCurrentRole(null);
    setActiveTab('dashboard');
  };

  // Switch institute
  const switchInstitute = async (instituteId: string): Promise<void> => {
    const inst = institutes.find((i) => i.id === instituteId);
    if (!inst) return;

    setActiveInstitute(inst);
    localStorage.setItem(STORAGE_KEYS.INSTITUTE, inst.id);

    // Refresh institute-specific academic years
    const allYears = await getAll<AcademicYear>('academicYears');
    const instYears = allYears.filter((y) => y.instituteId === inst.id || y.instituteId === 'both');
    setAcademicYears(instYears);

    const activeYear = instYears.find((y) => y.isActive) || instYears[0] || null;
    setActiveAcademicYear(activeYear);
    if (activeYear) {
      localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEAR, activeYear.id);
    }

    if (currentUser) {
      await createAuditLog(
        'INSTITUTE_SWITCH',
        'institute',
        `Switched context to ${inst.name} (${inst.type.toUpperCase()})`,
        currentUser.id,
        currentUser.username,
        inst.id,
        inst.id
      );
    }
  };

  // Switch academic year
  const switchAcademicYear = async (yearId: string): Promise<void> => {
    const year = academicYears.find((y) => y.id === yearId);
    if (!year) return;

    setActiveAcademicYear(year);
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEAR, year.id);

    if (currentUser) {
      await createAuditLog(
        'ACADEMIC_YEAR_SWITCH',
        'academic',
        `Switched active academic year to ${year.yearName}`,
        currentUser.id,
        currentUser.username,
        year.id,
        activeInstitute?.id
      );
    }
  };

  const setLanguage = async (lang: Language): Promise<void> => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
    if (settings) {
      const updated = { ...settings, defaultLanguage: lang, updatedAt: new Date().toISOString() };
      await update('settings', updated);
      setSettings(updated);
    }
  };

  const setTheme = async (newTheme: 'light' | 'dark'): Promise<void> => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (settings) {
      const updated = { ...settings, theme: newTheme, updatedAt: new Date().toISOString() };
      await update('settings', updated);
      setSettings(updated);
    }
  };

  // RBAC Permission Check
  const hasPermission = (module: ERPModule, action: PermissionAction): boolean => {
    if (!currentUser) return false;
    if (currentRole?.id === 'role_super_admin' || currentRole?.id === 'role_admin') return true;
    if (!currentRole || !currentRole.permissions) return false;

    const modulePerms = currentRole.permissions[module];
    if (!modulePerms) return false;
    return modulePerms.includes(action);
  };

  const logAudit = async (
    action: string,
    module: ERPModule | 'auth' | 'setup' | 'system',
    details: string,
    recordId?: string
  ): Promise<void> => {
    await createAuditLog(
      action,
      module,
      details,
      currentUser?.id || 'system',
      currentUser?.username || 'System',
      recordId,
      activeInstitute?.id
    );
  };

  // Complete First-Time Setup Wizard
  const completeSetupWizard = async (setupData: {
    adminUser: {
      username: string;
      password: string;
      fullName: string;
      email?: string;
      mobile?: string;
    };
    school: {
      name: string;
      bengaliName: string;
      eiin: string;
      address: string;
      phone: string;
      email: string;
      principalName: string;
      establishedYear: string;
      motto: string;
      logoUrl?: string;
      headRole?: InstituteHeadRole;
      headTitle?: string;
      headTitleBengali?: string;
      signatureUrl?: string;
    };
    college: {
      name: string;
      bengaliName: string;
      eiin: string;
      address: string;
      phone: string;
      email: string;
      principalName: string;
      vicePrincipalName?: string;
      actingPrincipalName?: string;
      establishedYear: string;
      motto: string;
      logoUrl?: string;
      headRole?: InstituteHeadRole;
      headTitle?: string;
      headTitleBengali?: string;
      signatureUrl?: string;
      viceSignatureUrl?: string;
      actingSignatureUrl?: string;
    };
    initialYears: string[];
    activeYear: string;
  }): Promise<void> => {
    await initializeDefaults();

    // 1. Create School
    const schoolId = 'inst_school_' + Date.now();
    const schoolHeadRole = setupData.school.headRole || 'headmaster';
    const schoolHeadTitle =
      schoolHeadRole === 'acting_headmaster'
        ? 'Acting Headmaster'
        : schoolHeadRole === 'assistant_headmaster'
        ? 'Assistant Headmaster'
        : schoolHeadRole === 'principal'
        ? 'Principal'
        : 'Headmaster';
    const schoolHeadBengali =
      schoolHeadRole === 'acting_headmaster'
        ? 'ভারপ্রাপ্ত প্রধান শিক্ষক'
        : schoolHeadRole === 'assistant_headmaster'
        ? 'সহকারী প্রধান শিক্ষক'
        : schoolHeadRole === 'principal'
        ? 'অধ্যক্ষ'
        : 'প্রধান শিক্ষক';

    const school: Institute = {
      id: schoolId,
      type: 'school',
      name: setupData.school.name || 'Model High School',
      bengaliName: setupData.school.bengaliName || 'মডেল উচ্চ বিদ্যালয়',
      code: 'SCH-01',
      eiin: setupData.school.eiin || '123456',
      address: setupData.school.address || 'Dhaka, Bangladesh',
      phone: setupData.school.phone || '+8801700000001',
      email: setupData.school.email || 'school@example.edu.bd',
      website: 'www.school.edu.bd',
      motto: setupData.school.motto || 'Knowledge is Power',
      establishedYear: setupData.school.establishedYear || '1995',
      principalName: setupData.school.principalName || 'Headmaster',
      logoUrl: setupData.school.logoUrl,
      headRole: schoolHeadRole,
      headTitle: schoolHeadTitle,
      headTitleBengali: schoolHeadBengali,
      signatureUrl: setupData.school.signatureUrl,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await add('institutes', school);

    // 2. Create College
    const collegeId = 'inst_college_' + Date.now();
    const collegeHeadRole = setupData.college.headRole || 'principal';
    const collegeHeadTitle =
      collegeHeadRole === 'acting_principal'
        ? 'Acting Principal'
        : collegeHeadRole === 'vice_principal'
        ? 'Vice-Principal'
        : 'Principal';
    const collegeHeadBengali =
      collegeHeadRole === 'acting_principal'
        ? 'ভারপ্রাপ্ত অধ্যক্ষ'
        : collegeHeadRole === 'vice_principal'
        ? 'উপাধ্যক্ষ'
        : 'অধ্যক্ষ';

    const college: Institute = {
      id: collegeId,
      type: 'college',
      name: setupData.college.name || 'City Model College',
      bengaliName: setupData.college.bengaliName || 'সিটি মডেল কলেজ',
      code: 'COL-01',
      eiin: setupData.college.eiin || '654321',
      address: setupData.college.address || 'Dhaka, Bangladesh',
      phone: setupData.college.phone || '+8801700000002',
      email: setupData.college.email || 'college@example.edu.bd',
      website: 'www.college.edu.bd',
      motto: setupData.college.motto || 'Excellence in Education',
      establishedYear: setupData.college.establishedYear || '2005',
      principalName: setupData.college.principalName || 'Principal',
      vicePrincipalName: setupData.college.vicePrincipalName,
      actingPrincipalName: setupData.college.actingPrincipalName,
      logoUrl: setupData.college.logoUrl,
      headRole: collegeHeadRole,
      headTitle: collegeHeadTitle,
      headTitleBengali: collegeHeadBengali,
      signatureUrl: setupData.college.signatureUrl,
      viceSignatureUrl: setupData.college.viceSignatureUrl,
      actingSignatureUrl: setupData.college.actingSignatureUrl,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await add('institutes', college);

    // 3. Create Academic Years for both
    for (const yearStr of setupData.initialYears) {
      const isAct = yearStr === setupData.activeYear;

      // School year
      const sYear: AcademicYear = {
        id: `year_sch_${yearStr}_${Date.now()}`,
        instituteId: schoolId,
        yearName: yearStr,
        startDate: `${yearStr}-01-01`,
        endDate: `${yearStr}-12-31`,
        isActive: isAct,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await add('academicYears', sYear);

      // College year (e.g. 2025-26 / 2026-27 session)
      const nextColYear = Number(yearStr) + 1;
      const cYear: AcademicYear = {
        id: `year_col_${yearStr}_${Date.now()}`,
        instituteId: collegeId,
        yearName: `${yearStr}-${String(nextColYear).slice(-2)}`,
        startDate: `${yearStr}-07-01`,
        endDate: `${nextColYear}-06-30`,
        isActive: isAct,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await add('academicYears', cYear);
    }

    // 4. Create Super Administrator user
    const passwordHash = await hashPassword(setupData.adminUser.password);
    const adminUser: User = {
      id: 'usr_admin_' + Date.now(),
      username: setupData.adminUser.username.trim(),
      passwordHash,
      fullName: setupData.adminUser.fullName || 'System Administrator',
      email: setupData.adminUser.email || 'admin@schoolcollege.local',
      mobile: setupData.adminUser.mobile || '+8801700000000',
      roleId: 'role_super_admin',
      instituteAccess: 'all',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await add('users', adminUser);

    // 5. Seed initial curriculum for school and college
    try {
      await seedStandardCurriculum(school, { id: `year_sch_${setupData.activeYear}`, yearName: setupData.activeYear } as any);
      await seedStandardCurriculum(college, { id: `year_col_${setupData.activeYear}`, yearName: setupData.activeYear } as any);
    } catch (err) {
      console.warn('Initial curriculum seed non-fatal warning:', err);
    }

    // 6. Audit Log
    await createAuditLog(
      'FIRST_TIME_SETUP',
      'setup',
      `Initial setup completed with academic curriculum. School: "${school.name}", College: "${college.name}", Admin: "${adminUser.username}"`,
      adminUser.id,
      adminUser.username,
      undefined,
      schoolId
    );

    // Save initial session
    localStorage.setItem(STORAGE_KEYS.INSTITUTE, schoolId);
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, adminUser.id);
    setCurrentUser(adminUser);

    await refreshContext();
  };

  return (
    <AppContext.Provider
      value={{
        isReady,
        isInitialized,
        currentUser,
        currentRole,
        isLiveMode,
        setIsLiveMode,
        activeInstitute,
        activeAcademicYear,
        institutes,
        academicYears,
        roles,
        settings,
        language,
        theme,
        activeTab,
        t,
        backupReminder,
        dismissBackupReminder,
        triggerAutoBackupCheck,
        login,
        logout,
        switchInstitute,
        switchAcademicYear,
        setActiveTab,
        setLanguage,
        setTheme,
        hasPermission,
        logAudit,
        refreshContext,
        completeSetupWizard,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
