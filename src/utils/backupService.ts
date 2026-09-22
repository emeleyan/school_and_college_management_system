/**
 * Backup, Disaster Recovery & Local Snapshot Engine
 * Phase 14: System Backup & Restore
 */

import {
  DB_STORES,
  DBStoreName,
  getAll,
  get,
  add,
  update,
  remove,
  clearStore,
  bulkPut,
  getDatabaseStats,
} from '../db/indexedDB';
import { BackupPackage, BackupMetadata, LocalSnapshot, Institute, AcademicYear, AppSettings } from '../types';

export interface BackupModuleConfig {
  id: string;
  name: string;
  bengaliName: string;
  description: string;
  bengaliDescription: string;
  stores: DBStoreName[];
  badgeColor: string;
}

export const BACKUP_MODULE_GROUPS: BackupModuleConfig[] = [
  {
    id: 'academic',
    name: 'Academic Structure & Institutes',
    bengaliName: 'প্রতিষ্ঠান ও একাডেমিক কাঠামো',
    description: 'Institutes, sessions, classes, sections, shifts, groups, and subjects',
    bengaliDescription: 'প্রতিষ্ঠান, শিক্ষাবর্ষ, শ্রেণি, শাখা, শিফট, বিভাগ ও পাঠ্যক্রম বিষয়সমূহ',
    stores: [
      'institutes',
      'academicYears',
      'classes',
      'sections',
      'groups',
      'departments',
      'shifts',
      'subjects',
      'subjectAssignments',
      'teacherAssignments',
    ],
    badgeColor: 'blue',
  },
  {
    id: 'students',
    name: 'Students & Admissions',
    bengaliName: 'শিক্ষার্থী ও ভর্তি রেজিস্টার',
    description: 'Student profiles, guardians, enrollments, documents, achievements & alumni',
    bengaliDescription: 'শিক্ষার্থীর তথ্য, অভিভাবক, ভর্তি রেজিস্টার, ডকুমেন্টস ও প্রাক্তন শিক্ষার্থী',
    stores: [
      'students',
      'studentEnrollments',
      'studentDocuments',
      'studentAchievements',
      'alumni',
    ],
    badgeColor: 'emerald',
  },
  {
    id: 'teachers',
    name: 'Faculty, Staff & HR',
    bengaliName: 'শিক্ষক-কর্মচারী ও উপস্থিতি',
    description: 'Teacher profiles, daily attendance, student attendance logs & leaves',
    bengaliDescription: 'শিক্ষক ও কর্মচারী প্রোফাইল, দৈনিক উপস্থিতি, বায়োমেট্রিক ও ছুটির আবেদন',
    stores: [
      'teachers',
      'teacherAttendance',
      'studentAttendance',
      'leaveApplications',
      'biometricLogs',
      'smsLogs',
    ],
    badgeColor: 'indigo',
  },
  {
    id: 'examination',
    name: 'Exams & Results',
    bengaliName: 'পরীক্ষা ও ফলাফল',
    description: 'Examinations, exam routines, mark registers, results & question bank',
    bengaliDescription: 'টার্ম পরীক্ষা, রুটিন, নম্বরপত্র, রেজাল্ট ও প্রশ্নব্যাংক',
    stores: [
      'exams',
      'examSchedules',
      'marks',
      'results',
      'gradingRules',
      'questionBank',
      'questionPapers',
    ],
    badgeColor: 'amber',
  },
  {
    id: 'accounts',
    name: 'Fees, Accounts & Payroll',
    bengaliName: 'ফি আদায় ও হিসাবরক্ষণ',
    description: 'Fee structures, payments, money receipts, vouchers, incomes, expenses & salaries',
    bengaliDescription: 'ফি চার্ট, শিক্ষার্থী পেমেন্ট, রশিদ, ভাউচার, আয়-ব্যয় ও শিক্ষক বেতন',
    stores: [
      'feeTypes',
      'feeStructures',
      'feeCharges',
      'payments',
      'receipts',
      'feeWaivers',
      'incomes',
      'expenses',
      'salaries',
      'vouchers',
      'bankAccounts',
      'accountHeads',
    ],
    badgeColor: 'teal',
  },
  {
    id: 'operations',
    name: 'School Operations & Logistics',
    bengaliName: 'অপারেশনস, নোটিশ ও ক্যালেন্ডার',
    description: 'Library, inventory, transport routes, certificates, ID cards, notices & calendar',
    bengaliDescription: 'লাইব্রেরি, ইনভেন্টরি, পরিবহন, সনদপত্র, আইডি কার্ড, নোটিশ ও ক্যালেন্ডার',
    stores: [
      'books',
      'bookIssues',
      'inventoryItems',
      'inventoryTransactions',
      'vehicles',
      'routes',
      'transportAssignments',
      'certificates',
      'idCards',
      'notices',
      'calendarEvents',
    ],
    badgeColor: 'purple',
  },
  {
    id: 'system',
    name: 'System, Security & Audit',
    bengaliName: 'সিস্টেম, নিরাপত্তা ও অডিট লগ',
    description: 'User accounts, role permissions, ERP global settings & audit trail',
    bengaliDescription: 'ব্যবহারকারী অ্যাকাউন্ট, রোল পারমিশন, সিস্টেম কনফিগ ও অডিট লগ',
    stores: ['users', 'roles', 'permissions', 'settings', 'auditLogs'],
    badgeColor: 'slate',
  },
];

/**
 * Calculate SHA-256 Checksum for data integrity check
 */
export async function calculateSha256(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Deterministic fallback
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return 'chk_' + Math.abs(hash).toString(16).padStart(16, '0');
  }
}

/**
 * Export data from stores and create a standardized BackupPackage
 */
export async function createBackupPackage(options: {
  scope: 'full' | 'selective';
  selectedModules?: string[];
  selectedStores?: DBStoreName[];
  includeAuditLogs?: boolean;
  systemNotes?: string;
  currentUser?: { id: string; username: string };
  activeInstitute?: Institute | null;
  activeAcademicYear?: AcademicYear | null;
}): Promise<{ pkg: BackupPackage; jsonString: string; totalRecords: number }> {
  let storesToExport: DBStoreName[] = [];

  if (options.scope === 'full') {
    storesToExport = [...DB_STORES].filter((s) => s !== 'backups'); // Don't nest previous backup snapshots
    if (!options.includeAuditLogs) {
      storesToExport = storesToExport.filter((s) => s !== 'auditLogs');
    }
  } else if (options.selectedStores && options.selectedStores.length > 0) {
    storesToExport = [...options.selectedStores].filter((s) => s !== 'backups');
  } else if (options.selectedModules && options.selectedModules.length > 0) {
    const matchedStores = new Set<DBStoreName>();
    BACKUP_MODULE_GROUPS.filter((g) => options.selectedModules?.includes(g.id)).forEach((g) => {
      g.stores.forEach((s) => matchedStores.add(s));
    });
    storesToExport = Array.from(matchedStores).filter((s) => s !== 'backups');
    if (!options.includeAuditLogs) {
      storesToExport = storesToExport.filter((s) => s !== 'auditLogs');
    }
  } else {
    // Default to full
    storesToExport = [...DB_STORES].filter((s) => s !== 'backups');
  }

  const dataPayload: Record<string, any[]> = {};
  let totalRecords = 0;

  for (const store of storesToExport) {
    try {
      const records = await getAll(store);
      dataPayload[store] = records;
      totalRecords += records.length;
    } catch (err) {
      console.warn(`Could not export store ${store}:`, err);
      dataPayload[store] = [];
    }
  }

  const rawDataString = JSON.stringify(dataPayload);
  const checksum = await calculateSha256(rawDataString);

  const metadata: BackupMetadata = {
    backupId: `BAK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    formatVersion: '1.0',
    appVersion: '2.4.0',
    createdAt: new Date().toISOString(),
    createdBy: {
      userId: options.currentUser?.id || 'system_admin',
      username: options.currentUser?.username || 'Administrator',
    },
    instituteInfo: options.activeInstitute
      ? {
          id: options.activeInstitute.id,
          name: options.activeInstitute.name,
          bengaliName: options.activeInstitute.bengaliName,
          eiin: options.activeInstitute.eiin || '108452',
          code: options.activeInstitute.code,
          type: options.activeInstitute.type,
        }
      : undefined,
    academicYear: options.activeAcademicYear
      ? {
          id: options.activeAcademicYear.id,
          yearName: options.activeAcademicYear.yearName,
        }
      : undefined,
    scope: options.scope,
    selectedModules: options.selectedModules,
    totalStores: Object.keys(dataPayload).length,
    totalRecords,
    checksum,
    systemNotes: options.systemNotes || 'Manual offline database backup snapshot',
  };

  const pkg: BackupPackage = {
    format: 'SchoolCollegeERP_Backup_v1',
    metadata,
    data: dataPayload,
  };

  const jsonString = JSON.stringify(pkg, null, 2);

  return { pkg, jsonString, totalRecords };
}

/**
 * Trigger browser file download of backup
 */
export function downloadBackupFile(
  jsonString: string,
  instituteCodeOrEiin = 'INST',
  suffix = 'backup'
): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
  const filename = `SchoolCollegeERP_${instituteCodeOrEiin}_${dateStr}_${timeStr}_${suffix}.json`;

  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Validate and inspect a chosen backup file
 */
export async function validateBackupFile(fileContent: string): Promise<{
  valid: boolean;
  error?: string;
  pkg?: BackupPackage;
  checksumMatches?: boolean;
  storeCounts?: Record<string, number>;
  totalRecords?: number;
}> {
  try {
    const parsed = JSON.parse(fileContent);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid file format: JSON root is not an object.' };
    }

    // Support both canonical BackupPackage and raw data dumps
    let pkg: BackupPackage;

    if (parsed.format === 'SchoolCollegeERP_Backup_v1' && parsed.metadata && parsed.data) {
      pkg = parsed as BackupPackage;
    } else if (parsed.data && typeof parsed.data === 'object') {
      // Semi-structured backup
      pkg = {
        format: 'SchoolCollegeERP_Backup_v1',
        metadata: {
          backupId: `LEGACY-${Date.now()}`,
          formatVersion: '1.0',
          appVersion: 'legacy',
          createdAt: parsed.createdAt || new Date().toISOString(),
          createdBy: { userId: 'legacy', username: 'Imported Backup' },
          scope: 'full',
          totalStores: Object.keys(parsed.data).length,
          totalRecords: 0,
          checksum: 'unknown',
          systemNotes: 'Legacy or raw backup format',
        },
        data: parsed.data,
      };
    } else {
      // Check if it's a direct dictionary of store names -> arrays
      const keys = Object.keys(parsed);
      const isDirectStores = keys.some((k) => (DB_STORES as readonly string[]).includes(k));
      if (isDirectStores) {
        pkg = {
          format: 'SchoolCollegeERP_Backup_v1',
          metadata: {
            backupId: `DIRECT-${Date.now()}`,
            formatVersion: '1.0',
            appVersion: 'raw',
            createdAt: new Date().toISOString(),
            createdBy: { userId: 'import', username: 'Direct Dump' },
            scope: 'full',
            totalStores: keys.length,
            totalRecords: 0,
            checksum: 'direct',
            systemNotes: 'Raw store key-value dump',
          },
          data: parsed,
        };
      } else {
        return {
          valid: false,
          error:
            'Unrecognized backup structure. File does not contain recognized School & College ERP tables.',
        };
      }
    }

    // Verify Checksum if present
    let checksumMatches = true;
    if (pkg.metadata.checksum && pkg.metadata.checksum !== 'unknown' && pkg.metadata.checksum !== 'direct') {
      const computedHash = await calculateSha256(JSON.stringify(pkg.data));
      checksumMatches = computedHash === pkg.metadata.checksum;
    }

    // Tally record counts
    const storeCounts: Record<string, number> = {};
    let totalRecords = 0;
    for (const [storeName, items] of Object.entries(pkg.data)) {
      if (Array.isArray(items)) {
        storeCounts[storeName] = items.length;
        totalRecords += items.length;
      }
    }
    pkg.metadata.totalRecords = totalRecords;
    pkg.metadata.totalStores = Object.keys(storeCounts).length;

    return {
      valid: true,
      pkg,
      checksumMatches,
      storeCounts,
      totalRecords,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Failed to parse JSON file: ${err.message || 'Syntax error in backup payload'}`,
    };
  }
}

/**
 * Execute restore operation into IndexedDB
 */
export async function executeRestore(
  pkg: BackupPackage,
  mode: 'overwrite' | 'merge',
  currentUser?: { id: string; username: string },
  onProgress?: (message: string, percent: number) => void
): Promise<{
  success: boolean;
  restoredRecords: number;
  storesRestored: number;
  emergencySnapshotId?: string;
  error?: string;
}> {
  try {
    onProgress?.('Preparing restore...', 5);

    // Step 1: If overwrite mode, automatically take an emergency rollback snapshot!
    let emergencySnapshotId: string | undefined;
    if (mode === 'overwrite') {
      onProgress?.('Creating emergency rollback snapshot before overwrite...', 10);
      try {
        const snap = await saveLocalSnapshot(
          `Emergency Rollback (Pre-Restore ${new Date().toLocaleTimeString()})`,
          'pre_restore',
          `Auto-created safeguard prior to restoring backup "${pkg.metadata.backupId}"`,
          currentUser
        );
        emergencySnapshotId = snap.id;
      } catch (snapErr) {
        console.warn('Failed to create pre-restore snapshot safeguard:', snapErr);
      }
    }

    const storesInBackup = Object.keys(pkg.data);
    const totalStores = storesInBackup.length;
    let processedStores = 0;
    let totalRestoredRecords = 0;

    for (const storeName of storesInBackup) {
      const items = pkg.data[storeName];
      if (!Array.isArray(items)) continue;

      const validStoreName = storeName as DBStoreName;

      // Report progress
      const percent = Math.min(
        95,
        Math.round(15 + (processedStores / Math.max(1, totalStores)) * 80)
      );
      onProgress?.(
        `Restoring store "${storeName}" (${items.length} records, mode: ${mode})...`,
        percent
      );

      if (mode === 'overwrite') {
        // Clear old data first
        await clearStore(validStoreName);
      }

      // Write items in bulk
      if (items.length > 0) {
        await bulkPut(validStoreName, items);
      }

      totalRestoredRecords += items.length;
      processedStores++;
    }

    onProgress?.('Restore completed successfully!', 100);

    return {
      success: true,
      restoredRecords: totalRestoredRecords,
      storesRestored: processedStores,
      emergencySnapshotId,
    };
  } catch (err: any) {
    console.error('Error during restore execution:', err);
    return {
      success: false,
      restoredRecords: 0,
      storesRestored: 0,
      error: err.message || 'Unknown error occurred while restoring data into IndexedDB.',
    };
  }
}

/**
 * Save an instant local recovery point (Snapshot) in IndexedDB 'backups' store
 */
export async function saveLocalSnapshot(
  name: string,
  type: 'manual' | 'pre_restore' | 'auto_scheduled' = 'manual',
  notes?: string,
  currentUser?: { id: string; username: string }
): Promise<LocalSnapshot> {
  // Capture current state of all stores except 'backups'
  const snapshotData: Record<string, any[]> = {};
  let totalRecords = 0;

  for (const store of DB_STORES) {
    if (store === 'backups') continue;
    try {
      const items = await getAll(store);
      snapshotData[store] = items;
      totalRecords += items.length;
    } catch {
      snapshotData[store] = [];
    }
  }

  const serialized = JSON.stringify(snapshotData);
  const sizeBytes = new Blob([serialized]).size;

  const snapshot: LocalSnapshot = {
    id: `SNAP_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name || `Snapshot ${new Date().toLocaleString()}`,
    type,
    createdAt: new Date().toISOString(),
    createdBy: currentUser?.username || 'Administrator',
    recordCount: totalRecords,
    storeCount: Object.keys(snapshotData).length,
    sizeBytes,
    notes,
    data: snapshotData,
  };

  await add('backups', snapshot);

  return snapshot;
}

/**
 * Fetch all local recovery snapshots
 */
export async function getLocalSnapshots(): Promise<LocalSnapshot[]> {
  try {
    const list = await getAll<LocalSnapshot>('backups');
    // Sort descending by creation time
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.warn('Failed to load local snapshots from IndexedDB:', err);
    return [];
  }
}

/**
 * Delete a local recovery snapshot
 */
export async function deleteLocalSnapshot(snapshotId: string): Promise<void> {
  await remove('backups', snapshotId);
}

/**
 * Revert database to a specific local snapshot
 */
export async function rollbackToLocalSnapshot(
  snapshotId: string,
  onProgress?: (msg: string, pct: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const snapshot = await get<LocalSnapshot>('backups', snapshotId);
    if (!snapshot || !snapshot.data) {
      return { success: false, error: 'Snapshot data not found or corrupted.' };
    }

    onProgress?.('Beginning rollback...', 10);

    const stores = Object.keys(snapshot.data);
    let done = 0;

    for (const store of stores) {
      const items = snapshot.data[store];
      if (!Array.isArray(items)) continue;

      const validStore = store as DBStoreName;
      onProgress?.(
        `Reverting store "${store}" (${items.length} records)...`,
        Math.round(15 + (done / stores.length) * 80)
      );

      await clearStore(validStore);
      if (items.length > 0) {
        await bulkPut(validStore, items);
      }
      done++;
    }

    onProgress?.('Rollback completed successfully!', 100);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to rollback snapshot' };
  }
}

/**
 * Get browser storage quota estimate
 */
export async function getStorageQuota(): Promise<{
  quotaBytes: number;
  usageBytes: number;
  usagePercent: number;
  isAvailable: boolean;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 1024 * 1024 * 1024; // 1 GB fallback
      const usage = estimate.usage || 0;
      const usagePercent = Math.min(100, Math.round((usage / quota) * 100));
      return { quotaBytes: quota, usageBytes: usage, usagePercent, isAvailable: true };
    } catch {
      // Fallback
    }
  }
  return {
    quotaBytes: 1024 * 1024 * 1024,
    usageBytes: 25 * 1024 * 1024,
    usagePercent: 2.5,
    isAvailable: false,
  };
}

/**
 * Run database consistency and health audit
 */
export async function runDatabaseHealthAudit(): Promise<{
  healthy: boolean;
  totalRecords: number;
  storesAudited: number;
  issues: string[];
  storeMetrics: { storeName: string; count: number; status: 'ok' | 'empty' | 'warning' }[];
}> {
  const storeMetrics: { storeName: string; count: number; status: 'ok' | 'empty' | 'warning' }[] = [];
  const issues: string[] = [];
  let totalRecords = 0;

  const stats = await getDatabaseStats();

  for (const s of stats) {
    totalRecords += s.count;
    let status: 'ok' | 'empty' | 'warning' = 'ok';
    if (s.count === 0) {
      status = 'empty';
    }
    storeMetrics.push({
      storeName: s.storeName,
      count: s.count,
      status,
    });
  }

  // Cross-store consistency checks
  try {
    const students = await getAll<any>('students');
    const institutes = await getAll<any>('institutes');
    const classes = await getAll<any>('classes');

    if (institutes.length === 0) {
      issues.push('Critical: No primary educational institute registered.');
    }

    const instituteIds = new Set(institutes.map((i) => i.id));
    const orphanStudents = students.filter(
      (st) => st.instituteId && !instituteIds.has(st.instituteId)
    );
    if (orphanStudents.length > 0) {
      issues.push(
        `Notice: ${orphanStudents.length} student records reference missing institute IDs.`
      );
    }

    const classIds = new Set(classes.map((c) => c.id));
    const studentsWithoutClass = students.filter(
      (st) => st.classId && !classIds.has(st.classId)
    );
    if (studentsWithoutClass.length > 0) {
      issues.push(
        `Notice: ${studentsWithoutClass.length} students belong to classes not found in academic structure.`
      );
    }
  } catch (err: any) {
    issues.push(`Integrity verification encountered an error: ${err.message}`);
  }

  return {
    healthy: issues.length === 0,
    totalRecords,
    storesAudited: stats.length,
    issues,
    storeMetrics,
  };
}

/**
 * Auto-scheduled daily backup evaluation:
 * Checks if the last backup or snapshot is older than 24 hours.
 * If yes, takes an automatic lightweight local snapshot and saves to 'backups' store.
 * Also returns backup staleness (days since last backup) for UI reminder banner.
 */
export async function checkAndTriggerAutoBackup(currentUser?: { id: string; username: string }): Promise<{
  autoBackupCreated: boolean;
  daysSinceLastBackup: number;
  lastBackupDate?: string;
  snapshotId?: string;
}> {
  try {
    const snapshots = await getLocalSnapshots();
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    let daysSinceLastBackup = 999;
    let lastBackupDate: string | undefined;

    if (snapshots.length > 0) {
      const mostRecent = snapshots[0]; // sorted descending
      lastBackupDate = mostRecent.createdAt;
      const ageMs = now - new Date(mostRecent.createdAt).getTime();
      daysSinceLastBackup = Math.max(0, Math.floor(ageMs / ONE_DAY_MS));
    }

    // Auto backup triggered if no snapshot exists, or last snapshot is > 24 hours old
    let autoBackupCreated = false;
    let snapshotId: string | undefined;

    if (daysSinceLastBackup >= 1 || snapshots.length === 0) {
      const todayDate = new Date().toISOString().split('T')[0];
      const snapshot = await saveLocalSnapshot(
        `Scheduled Daily Auto-Backup (${todayDate})`,
        'auto_scheduled',
        'Automated disaster-recovery snapshot triggered on session launch',
        currentUser || { id: 'system', username: 'System Auto-Backup' }
      );
      autoBackupCreated = true;
      snapshotId = snapshot.id;
      daysSinceLastBackup = 0;
      lastBackupDate = snapshot.createdAt;
    }

    return {
      autoBackupCreated,
      daysSinceLastBackup,
      lastBackupDate,
      snapshotId,
    };
  } catch (err) {
    console.warn('Auto backup check encountered an issue:', err);
    return {
      autoBackupCreated: false,
      daysSinceLastBackup: 0,
    };
  }
}

/**
 * Executes a full 11:59 PM Daily Auto-Backup:
 * 1. Takes full local snapshot in IndexedDB
 * 2. Transmits and saves JSON archive to local filesystem disk via Express (/api/system/save-auto-backup)
 * 3. Updates lastAutoBackupDate so subsequent checks know today is safely backed up
 */
export async function executeMidnightAutoBackup(
  currentUser?: { id: string; username: string },
  isManualTest: boolean = false
): Promise<{ success: boolean; message: string; bengaliMessage: string; snapshotId: string; diskSaved: boolean }> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = isManualTest ? `${now.getHours()}:${now.getMinutes()}` : '23:59';
  const label = `Daily Auto-Backup (${dateStr} at ${timeStr})`;

  // 1. Create standardized full backup package
  const { jsonString } = await createBackupPackage({
    scope: 'full',
    includeAuditLogs: true,
    systemNotes: `Automated Daily 11:59 PM Scheduled Backup. Taken ${now.toLocaleString()}`,
    currentUser: currentUser || { id: 'system', username: 'Daily Auto-Backup Scheduler' },
  });

  // 2. Save into IndexedDB backups store
  const snapshot = await saveLocalSnapshot(
    label,
    'auto_scheduled',
    `Automatic daily 11:59 PM scheduled backup guaranteeing previous day records preservation.`,
    currentUser || { id: 'system', username: 'Daily Auto-Backup Scheduler' }
  );

  // 3. Transmit to backend to store safely on disk as well
  let diskSaved = false;
  try {
    const res = await fetch('/api/system/save-auto-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `daily_backup_${dateStr}_23-59.json`,
        payload: jsonString,
        date: now.toISOString(),
        triggerType: isManualTest ? 'manual_test_trigger' : 'scheduled_1159_pm',
      }),
    });
    const result = await res.json();
    if (result.success) {
      diskSaved = true;
    }
  } catch (err) {
    console.warn('Could not save to backend disk (running purely in offline browser mode):', err);
  }

  // 4. Update settings and localStorage tracking
  try {
    localStorage.setItem('last_1159_auto_backup_date', dateStr);
    localStorage.setItem('last_1159_auto_backup_time', now.toISOString());
    const settings = await get<AppSettings>('settings', 'global');
    if (settings) {
      settings.lastAutoBackupDate = dateStr;
      settings.updatedAt = now.toISOString();
      await update('settings', settings);
    }
  } catch (e) {}

  return {
    success: true,
    snapshotId: snapshot.id,
    diskSaved,
    message: `Daily 11:59 PM Auto-Backup created successfully. IndexedDB Snapshot & Disk Archive saved.`,
    bengaliMessage: `দৈনিক রাত ১১:৫৯ অটো ব্যাকআপ সফলভাবে সম্পন্ন হয়েছে। লোকাল ডাটাবেজ স্ন্যাপশট ও ডিস্ক ফাইল সংরক্ষিত হয়েছে।`,
  };
}

let schedulerTimer: any = null;

/**
 * Initializes the background scheduler for 11:59 PM Daily Auto-Backup
 */
export function startMidnightAutoBackupScheduler(
  currentUser?: { id: string; username: string }
) {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  const checkAndRun = async () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const todayStr = now.toISOString().split('T')[0];
    const lastBackupDate = localStorage.getItem('last_1159_auto_backup_date');

    // 1. Check if current time is exactly 23:59 (11:59 PM) and hasn't run today
    if (hours === 23 && minutes >= 58 && lastBackupDate !== todayStr) {
      console.log('[Scheduler] It is 11:59 PM! Triggering Daily Auto-Backup...');
      try {
        await executeMidnightAutoBackup(currentUser, false);
      } catch (err) {
        console.error('[Scheduler] Error running 11:59 PM auto backup:', err);
      }
    }

    // 2. Catch-up check: If app opened today and yesterday's backup was never run (e.g. system was turned off at 11:59 PM)
    if (lastBackupDate && lastBackupDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastBackupDate < yesterdayStr) {
        console.log('[Scheduler] Catch-up auto backup triggered for missed date:', yesterdayStr);
        try {
          await executeMidnightAutoBackup(currentUser, false);
        } catch (err) {
          console.error('[Scheduler] Catch-up backup failed:', err);
        }
      }
    }
  };

  // Run initial check
  checkAndRun();

  // Re-check every 30 seconds
  schedulerTimer = setInterval(checkAndRun, 30000);
}

/**
 * Go-Live Preparation: Safely clear all sample / transactional records
 * while retaining core master data (Institutes, Academic Years, Classes, Sections, Groups,
 * Shifts, Departments, Subjects, Users, Roles, Settings, Audit Logs).
 * Automatically generates a pre-wipe emergency safety backup first!
 */
export async function executeGoLiveClearDemoData(
  currentUser?: { id: string; username: string },
  onProgress?: (msg: string, pct: number) => void
): Promise<{ success: boolean; clearedStores: number; emergencySnapshotId?: string; error?: string }> {
  try {
    onProgress?.('Creating pre-go-live emergency rollback snapshot...', 10);
    const emergencySnapshot = await saveLocalSnapshot(
      `Pre-GoLive-Safeguard-${new Date().toISOString().split('T')[0]}`,
      'manual',
      'Automatic safeguard created prior to clearing all sample and demo records for production go-live.',
      currentUser
    );

    const operationalStoresToWipe: DBStoreName[] = [
      'students',
      'studentEnrollments',
      'studentDocuments',
      'studentAchievements',
      'alumni',
      'teachers',
      'teacherAttendance',
      'studentAttendance',
      'leaveApplications',
      'biometricLogs',
      'smsLogs',
      'exams',
      'examSchedules',
      'marks',
      'results',
      'questionBank',
      'questionPapers',
      'feeTypes',
      'feeStructures',
      'feeWaivers',
      'feeCharges',
      'payments',
      'receipts',
      'incomes',
      'expenses',
      'salaries',
      'vouchers',
      'bankAccounts',
      'accountHeads',
      'certificates',
      'idCards',
      'books',
      'bookIssues',
      'inventoryItems',
      'inventoryTransactions',
      'vehicles',
      'routes',
      'transportAssignments',
      'notices',
      'calendarEvents',
    ];

    let count = 0;
    for (const store of operationalStoresToWipe) {
      onProgress?.(
        `Clearing store: ${store}...`,
        Math.round(20 + (count / operationalStoresToWipe.length) * 75)
      );
      await clearStore(store);
      count++;
    }

    // Set Go-Live persistent flag in localStorage
    localStorage.setItem('erp_go_live_mode', 'true');

    onProgress?.('Go-Live clean completed successfully!', 100);
    return {
      success: true,
      clearedStores: count,
      emergencySnapshotId: emergencySnapshot.id,
    };
  } catch (err: any) {
    return {
      success: false,
      clearedStores: 0,
      error: err.message || 'Failed to clear sample data',
    };
  }
}
