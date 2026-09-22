import { Role, AppSettings, ERPModule, PermissionAction } from '../types';

const allModules: ERPModule[] = [
  'dashboard',
  'institute',
  'students',
  'teachers',
  'academic',
  'attendance',
  'examination',
  'fees',
  'accounts',
  'library',
  'inventory',
  'transport',
  'certificates',
  'idcards',
  'notices',
  'calendar',
  'reports',
  'users',
  'settings',
  'backup',
  'audit',
];

const allActions: PermissionAction[] = [
  'view',
  'add',
  'edit',
  'delete',
  'print',
  'export',
  'import',
  'approve',
  'manage_settings',
];

const readActions: PermissionAction[] = ['view', 'print', 'export'];

// Full access permission set
const fullPermissions = allModules.reduce((acc, mod) => {
  acc[mod] = [...allActions];
  return acc;
}, {} as Record<ERPModule, PermissionAction[]>);

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'role_super_admin',
    name: 'Super Admin',
    bengaliName: 'সুপার অ্যাডমিন',
    description: 'Complete unrestricted access across both School and College ERP',
    isSystem: true,
    permissions: fullPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role_admin',
    name: 'Administrator',
    bengaliName: 'প্রশাসক',
    description: 'General system administration and operational management',
    isSystem: true,
    permissions: fullPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role_principal',
    name: 'Principal',
    bengaliName: 'অধ্যক্ষ / প্রধান শিক্ষক',
    description: 'Institutional head oversight with full approval and report permissions',
    isSystem: true,
    permissions: allModules.reduce((acc, mod) => {
      acc[mod] = ['view', 'approve', 'print', 'export'];
      return acc;
    }, {} as Record<ERPModule, PermissionAction[]>),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role_vice_principal',
    name: 'Vice Principal',
    bengaliName: 'উপাধ্যক্ষ / সহকারী প্রধান শিক্ষক',
    description: 'Academic and administrative oversight',
    isSystem: true,
    permissions: allModules.reduce((acc, mod) => {
      acc[mod] = ['view', 'approve', 'print', 'export'];
      return acc;
    }, {} as Record<ERPModule, PermissionAction[]>),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role_teacher',
    name: 'Teacher',
    bengaliName: 'শিক্ষক / প্রভাষক',
    description: 'Student attendance, exam marks entry, and academic viewing',
    isSystem: true,
    permissions: {
      ...allModules.reduce((acc, mod) => {
        acc[mod] = [];
        return acc;
      }, {} as Record<ERPModule, PermissionAction[]>),
      dashboard: ['view'],
      students: ['view', 'print'],
      academic: ['view'],
      attendance: ['view', 'add', 'edit', 'print'],
      examination: ['view', 'add', 'edit', 'print'],
      notices: ['view'],
      calendar: ['view'],
      reports: ['view', 'print'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role_accountant',
    name: 'Accountant',
    bengaliName: 'হিসাবরক্ষক',
    description: 'Fee collection, accounts, receipt issuance, and financial ledgers',
    isSystem: true,
    permissions: {
      ...allModules.reduce((acc, mod) => {
        acc[mod] = [];
        return acc;
      }, {} as Record<ERPModule, PermissionAction[]>),
      dashboard: ['view'],
      fees: ['view', 'add', 'edit', 'print', 'export', 'approve'],
      accounts: ['view', 'add', 'edit', 'print', 'export', 'approve'],
      students: ['view'],
      reports: ['view', 'print', 'export'],
      notices: ['view'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role_exam_controller',
    name: 'Examination Controller',
    bengaliName: 'পরীক্ষা নিয়ন্ত্রক',
    description: 'Exam scheduling, marks verification, admit cards, marksheets, results',
    isSystem: true,
    permissions: {
      ...allModules.reduce((acc, mod) => {
        acc[mod] = [];
        return acc;
      }, {} as Record<ERPModule, PermissionAction[]>),
      dashboard: ['view'],
      examination: ['view', 'add', 'edit', 'delete', 'approve', 'print', 'export'],
      students: ['view'],
      academic: ['view'],
      reports: ['view', 'print', 'export'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role_office_staff',
    name: 'Office Staff',
    bengaliName: 'অফিস স্টাফ',
    description: 'Student records, certificates, admit cards, and general operations',
    isSystem: true,
    permissions: {
      ...allModules.reduce((acc, mod) => {
        acc[mod] = [];
        return acc;
      }, {} as Record<ERPModule, PermissionAction[]>),
      dashboard: ['view'],
      students: ['view', 'add', 'edit', 'print'],
      certificates: ['view', 'add', 'print'],
      idcards: ['view', 'add', 'print'],
      notices: ['view'],
      attendance: ['view'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role_data_entry',
    name: 'Data Entry Operator',
    bengaliName: 'ডাটা এন্ট্রি অপারেটর',
    description: 'Inputting students, attendance, and fee data',
    isSystem: true,
    permissions: {
      ...allModules.reduce((acc, mod) => {
        acc[mod] = [];
        return acc;
      }, {} as Record<ERPModule, PermissionAction[]>),
      dashboard: ['view'],
      students: ['view', 'add', 'edit'],
      attendance: ['view', 'add'],
      fees: ['view', 'add'],
      examination: ['view', 'add'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  appName: 'School & College Management ERP',
  bengaliAppName: 'স্কুল ও কলেজ ম্যানেজমেন্ট ইআরপি',
  defaultLanguage: 'en',
  theme: 'light',
  sessionTimeoutMinutes: 60,
  enableAutoBackup: true,
  autoBackupInterval: 'daily',
  studentIdPrefixSchool: 'SCH',
  studentIdPrefixCollege: 'COL',
  receiptPrefix: 'RCP',
  certificatePrefix: 'CERT',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
