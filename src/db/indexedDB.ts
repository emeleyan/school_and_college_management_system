/**
 * IndexedDB Database Service Layer
 * Target Platform: Offline Windows Desktop / Offline Web App
 * Master Database for School & College Management ERP
 */

import { DEFAULT_ROLES, DEFAULT_SETTINGS } from './seedData';
import { AuditLog, Role, User, AppSettings, ERPModule } from '../types';

const DB_NAME = 'SchoolCollegeERP_DB';
const DB_VERSION = 8;

let dbInstance: IDBDatabase | null = null;
let dbOpeningPromise: Promise<IDBDatabase> | null = null;

// All stores specified in Section 100 of the Master Development Document
export const DB_STORES = [
  // Foundation & System
  'institutes',
  'academicYears',
  'users',
  'roles',
  'permissions',
  'auditLogs',
  'settings',

  // Academic Structure
  'classes',
  'sections',
  'groups',
  'departments',
  'shifts',
  'subjects',
  'masterSubjects',
  'syllabus',
  'subjectAssignments',
  'teacherAssignments',

  // Students
  'students',
  'studentEnrollments',
  'studentDocuments',
  'studentAchievements',
  'alumni',

  // Teachers & Staff
  'teachers',
  'teacherAttendance',
  'studentAttendance',
  'leaveApplications',
  'biometricLogs',
  'smsLogs',

  // Examinations & Results
  'exams',
  'examSchedules',
  'marks',
  'results',
  'gradingRules',
  'questionBank',
  'questionPapers',

  // Fees & Accounts
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

  // Library & Inventory
  'books',
  'bookIssues',
  'inventoryItems',
  'inventoryTransactions',

  // Transport
  'vehicles',
  'routes',
  'transportAssignments',

  // Certificates, IDs, Notices, Calendar
  'certificates',
  'idCards',
  'idCardTemplates',
  'documentTemplates',
  'notices',
  'calendarEvents',

  // Phase 14: Local Snapshots & Disaster Recovery
  'backups',
  // Granular Action History & Undo Engine
  'actionLogs',
] as const;

export type DBStoreName = (typeof DB_STORES)[number];

function setupStoresAndIndexes(db: IDBDatabase) {
  DB_STORES.forEach((storeName) => {
    if (!db.objectStoreNames.contains(storeName)) {
      const store = db.createObjectStore(storeName, { keyPath: 'id' });

      // Helpful indexes based on entity type
      if (storeName === 'institutes') {
        store.createIndex('by_type', 'type', { unique: false });
        store.createIndex('by_code', 'code', { unique: false });
      } else if (storeName === 'academicYears') {
        store.createIndex('by_instituteId', 'instituteId', { unique: false });
        store.createIndex('by_isActive', 'isActive', { unique: false });
      } else if (storeName === 'users') {
        store.createIndex('by_username', 'username', { unique: true });
        store.createIndex('by_roleId', 'roleId', { unique: false });
        store.createIndex('by_status', 'status', { unique: false });
      } else if (storeName === 'roles') {
        store.createIndex('by_name', 'name', { unique: false });
      } else if (storeName === 'auditLogs') {
        store.createIndex('by_timestamp', 'timestamp', { unique: false });
        store.createIndex('by_userId', 'userId', { unique: false });
        store.createIndex('by_instituteId', 'instituteId', { unique: false });
        store.createIndex('by_module', 'module', { unique: false });
      } else if (storeName === 'actionLogs') {
        store.createIndex('by_timestamp', 'timestamp', { unique: false });
        store.createIndex('by_actionType', 'actionType', { unique: false });
        store.createIndex('by_targetStore', 'targetStore', { unique: false });
        store.createIndex('by_isUndone', 'isUndone', { unique: false });
      } else {
        // General stores: index by instituteId and academicYearId where applicable
        try {
          store.createIndex('by_instituteId', 'instituteId', { unique: false });
        } catch (e) {
          // Ignore if already exists
        }
      }
    }
  });
}

function hasAllStores(db: IDBDatabase): boolean {
  for (const store of DB_STORES) {
    if (!db.objectStoreNames.contains(store)) {
      return false;
    }
  }
  return true;
}

function openDBInstance(version?: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      setupStoresAndIndexes(db);
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbInstance = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };

    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked. If multiple tabs are open, please reload.');
    };
  });
}

/**
 * Open or retrieve the IndexedDB database instance with self-healing store checking
 */
export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance && hasAllStores(dbInstance)) {
    return dbInstance;
  }

  if (dbOpeningPromise) {
    return dbOpeningPromise;
  }

  dbOpeningPromise = (async () => {
    try {
      if (dbInstance) {
        try {
          dbInstance.close();
        } catch {
          // Ignore
        }
        dbInstance = null;
      }

      // Step 1: Open WITHOUT a hardcoded version.
      // This allows opening whatever existing version is in the browser without ever throwing
      // "The requested version (X) is less than the existing version (Y)".
      let db = await openDBInstance();

      // Step 2: Check if all required object stores exist and if version >= DB_VERSION.
      if (!hasAllStores(db) || db.version < DB_VERSION) {
        const targetVersion = Math.max(db.version + 1, DB_VERSION);
        console.warn(
          `Upgrading IndexedDB schema from version ${db.version} to ${targetVersion} to ensure all stores exist...`
        );
        db.close();
        dbInstance = null;
        db = await openDBInstance(targetVersion);
      }

      dbInstance = db;
      return db;
    } catch (err: any) {
      console.error('Error opening IndexedDB, attempting fallback:', err);
      // Fallback: If version upgrade fails (e.g. concurrent locks), attempt clean open
      try {
        const fallbackDb = await openDBInstance();
        dbInstance = fallbackDb;
        return fallbackDb;
      } catch (fallbackErr) {
        throw err;
      }
    } finally {
      dbOpeningPromise = null;
    }
  })();

  return dbOpeningPromise;
}

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_SALT_BYTES = 16;

/**
 * Enterprise offline password hashing using Web Crypto API PBKDF2 with salt and 100,000 iterations.
 * Generates salted PBKDF2-HMAC-SHA256 string format: pbkdf2$<iterations>$<saltHex>$<derivedKeyHex>
 */
export async function hashPassword(password: string, customSaltHex?: string): Promise<string> {
  const encoder = new TextEncoder();
  let salt: Uint8Array;
  if (customSaltHex) {
    const bytes = customSaltHex.match(/.{1,2}/g) || [];
    salt = new Uint8Array(bytes.map((byte) => parseInt(byte, 16)));
  } else {
    salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  }
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password.trim()),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedKey))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

/**
 * Secure password verification supporting both modern PBKDF2 salted hashes
 * and backward compatibility with legacy unsalted SHA-256 hashes.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsUpgrade?: boolean }> {
  if (!password || !storedHash) return { valid: false };

  // 1. Modern PBKDF2 format: pbkdf2$<iterations>$<saltHex>$<hashHex>
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10) || PBKDF2_ITERATIONS;
      const saltHex = parts[2];
      const expectedHash = parts[3];

      const encoder = new TextEncoder();
      const bytes = saltHex.match(/.{1,2}/g) || [];
      const salt = new Uint8Array(bytes.map((b) => parseInt(b, 16)));

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password.trim()),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedKey = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );

      const computedHashHex = Array.from(new Uint8Array(derivedKey))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      return { valid: computedHashHex === expectedHash, needsUpgrade: false };
    }
  }

  // 2. Legacy fallback for old SHA-256 hashes (e.g. 64 hex characters)
  const encoder = new TextEncoder();
  const data = encoder.encode(password.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const legacyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  if (legacyHash === storedHash) {
    return { valid: true, needsUpgrade: true };
  }

  return { valid: false };
}

/**
 * Check if the system has been initialized with at least one administrator and one institute
 */
export async function isSystemInitialized(): Promise<boolean> {
  try {
    const db = await getDB();
    const users = await getAll<User>('users');
    const institutes = await getAll('institutes');
    return users.length > 0 && institutes.length > 0;
  } catch (error) {
    console.error('Error checking system initialization:', error);
    return false;
  }
}

/**
 * Initialize default roles and settings if not present
 */
let initDefaultsPromise: Promise<void> | null = null;

export async function initializeDefaults(): Promise<void> {
  if (initDefaultsPromise) return initDefaultsPromise;

  initDefaultsPromise = (async () => {
    try {
      await getDB();

      // Check roles and insert idempotently
      const existingRoles = await getAll<Role>('roles');
      if (existingRoles.length === 0) {
        for (const role of DEFAULT_ROLES) {
          await update('roles', role);
        }
      }

      // Check settings and insert idempotently
      const existingSettings = await get<AppSettings>('settings', 'global');
      if (!existingSettings) {
        await update('settings', DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.warn('Warning during initializeDefaults:', err);
    }
  })();

  return initDefaultsPromise;
}

/**
 * Generic CRUD methods
 */

export async function getAll<T>(storeName: DBStoreName): Promise<T[]> {
  const db = await getDB();
  if (!db.objectStoreNames.contains(storeName)) {
    console.warn(`Object store "${storeName}" not found in IndexedDB. Returning empty array.`);
    return [];
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    } catch (err) {
      console.error(`Transaction error in getAll('${storeName}'):`, err);
      resolve([]);
    }
  });
}

export async function get<T>(storeName: DBStoreName, id: string): Promise<T | null> {
  const db = await getDB();
  if (!db.objectStoreNames.contains(storeName)) {
    return null;
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(request.error);
    } catch (err) {
      console.error(`Transaction error in get('${storeName}', '${id}'):`, err);
      resolve(null);
    }
  });
}

export async function add<T>(storeName: DBStoreName, item: T): Promise<void> {
  const db = await getDB();
  if (!db.objectStoreNames.contains(storeName)) {
    console.warn(`Cannot add to store "${storeName}": store does not exist.`);
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      // Use put to ensure idempotency and prevent "Key already exists in the object store" errors
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      console.error(`Transaction error in add('${storeName}'):`, err);
      reject(err);
    }
  });
}

export async function update<T>(storeName: DBStoreName, item: T): Promise<void> {
  const db = await getDB();
  if (!db.objectStoreNames.contains(storeName)) {
    console.warn(`Cannot update in store "${storeName}": store does not exist.`);
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      console.error(`Transaction error in update('${storeName}'):`, err);
      reject(err);
    }
  });
}

export async function remove(storeName: DBStoreName, id: string): Promise<void> {
  const db = await getDB();
  if (!db.objectStoreNames.contains(storeName)) {
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      console.error(`Transaction error in remove('${storeName}'):`, err);
      resolve();
    }
  });
}

// Aliases for put/delete
export const putItem = update;
export const deleteItem = remove;

export async function queryByIndex<T>(
  storeName: DBStoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await getDB();
  if (!db.objectStoreNames.contains(storeName)) {
    return [];
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      if (!store.indexNames.contains(indexName)) {
        console.warn(`Index ${indexName} does not exist on ${storeName}`);
        resolve([]);
        return;
      }
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    } catch (err) {
      console.error(`Transaction error in queryByIndex('${storeName}', '${indexName}'):`, err);
      resolve([]);
    }
  });
}

export async function count(storeName: DBStoreName): Promise<number> {
  const db = await getDB();
  if (!db.objectStoreNames.contains(storeName)) {
    return 0;
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      console.error(`Transaction error in count('${storeName}'):`, err);
      resolve(0);
    }
  });
}

/**
 * Clear all records from a specific object store
 */
export async function clearStore(storeName: DBStoreName): Promise<void> {
  const db = await getDB();
  if (!db.objectStoreNames.contains(storeName)) {
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      console.error(`Transaction error in clearStore('${storeName}'):`, err);
      resolve();
    }
  });
}

/**
 * Bulk insert or update items in a single readwrite transaction
 */
export async function bulkPut(storeName: DBStoreName, items: any[]): Promise<void> {
  if (!items || items.length === 0) return;
  const db = await getDB();
  if (!db.objectStoreNames.contains(storeName)) {
    console.warn(`Cannot bulkPut to store "${storeName}": store does not exist.`);
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);

      for (const item of items) {
        store.put(item);
      }
    } catch (err) {
      console.error(`Transaction error in bulkPut('${storeName}'):`, err);
      reject(err);
    }
  });
}

/**
 * Clear all stores except protected ones (optionally)
 */
export async function clearAllStores(excludeStores: DBStoreName[] = []): Promise<void> {
  const db = await getDB();
  for (const storeName of DB_STORES) {
    if (!excludeStores.includes(storeName) && db.objectStoreNames.contains(storeName)) {
      await clearStore(storeName);
    }
  }
}

/**
 * Fetch record counts across all object stores
 */
export async function getDatabaseStats(): Promise<{ storeName: DBStoreName; count: number }[]> {
  const stats: { storeName: DBStoreName; count: number }[] = [];
  for (const storeName of DB_STORES) {
    try {
      const c = await count(storeName);
      stats.push({ storeName, count: c });
    } catch {
      stats.push({ storeName, count: 0 });
    }
  }
  return stats;
}

/**
 * Log an audit action into IndexedDB
 */
export async function createAuditLog(
  action: string,
  module: ERPModule | 'auth' | 'setup' | 'system',
  details: string,
  userId = 'system',
  username = 'System',
  recordId?: string,
  instituteId?: string
): Promise<void> {
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    userId,
    username,
    action,
    module,
    recordId,
    instituteId,
    details,
    timestamp: new Date().toISOString(),
  };

  try {
    await add('auditLogs', log);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
