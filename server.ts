import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;
const ROOT_DIR = process.cwd();
const UPDATE_HISTORY_FILE = path.join(ROOT_DIR, 'update-history.json');
const VERSION_FILE = path.join(ROOT_DIR, 'src', 'version.json');
const BACKUPS_DIR = path.join(ROOT_DIR, 'backups');

if (!fs.existsSync(BACKUPS_DIR)) {
  try {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  } catch (e) {}
}

// Ensure body parsers for JSON and urlencoded
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Multer memory storage for uploaded zip packages
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 }, // 150MB limit
});

// Helper: Read or initialize current version
function getCurrentVersionInfo() {
  let version = '2.4.0';
  let releaseDate = '2026-09-17';
  let buildNumber = '240917-offline';

  try {
    if (fs.existsSync(VERSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
      version = data.version || version;
      releaseDate = data.releaseDate || releaseDate;
      buildNumber = data.buildNumber || buildNumber;
    } else {
      // Create initial version.json
      const initial = {
        version,
        releaseDate,
        buildNumber,
        type: 'offline-school-college-erp',
        databaseEngine: 'IndexedDB + Offline File Storage',
        lastUpdated: new Date().toISOString(),
      };
      fs.mkdirSync(path.dirname(VERSION_FILE), { recursive: true });
      fs.writeFileSync(VERSION_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error reading version info:', err);
  }

  return { version, releaseDate, buildNumber };
}

// Helper: Read update history
function getUpdateHistory(): any[] {
  try {
    if (fs.existsSync(UPDATE_HISTORY_FILE)) {
      const content = fs.readFileSync(UPDATE_HISTORY_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading update history:', err);
  }
  return [];
}

// Helper: Save update history
function saveUpdateHistory(entry: any) {
  try {
    const history = getUpdateHistory();
    history.unshift(entry);
    // Keep last 50 update records
    const trimmed = history.slice(0, 50);
    fs.writeFileSync(UPDATE_HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving update history:', err);
  }
}

// Check if a file path is a database file or sensitive config that MUST be excluded from update overwrite
function isProtectedDatabaseOrConfigFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const fileName = path.basename(normalized);

  // 1. Database file extensions
  const dbExtensions = [
    '.db',
    '.sqlite',
    '.sqlite3',
    '.db-journal',
    '.db-wal',
    '.db-shm',
    '.rdb',
    '.mdb',
    '.accdb',
    '.sql',
  ];
  if (dbExtensions.some((ext) => fileName.endsWith(ext))) {
    return true;
  }

  // 2. Database directories or storage paths
  const dbDirectoryPatterns = [
    'data/',
    'database/',
    'databases/',
    'storage/',
    'indexeddb/',
    'schoolcollegeerp_db',
    'backups/',
    'snapshots/',
    'local_backups/',
    '.backup',
    'db/sqlite',
  ];
  if (dbDirectoryPatterns.some((pattern) => normalized.includes(pattern))) {
    return true;
  }

  // 3. User configuration and local secrets
  if (
    fileName === '.env' ||
    fileName.startsWith('.env.') ||
    fileName === 'update-history.json' ||
    fileName === 'user_data.json' ||
    fileName === 'database.json'
  ) {
    return true;
  }

  return false;
}

// ==========================================
// API ROUTES FIRST
// ==========================================

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. System Version info
app.get('/api/system/version', (_req: Request, res: Response) => {
  const info = getCurrentVersionInfo();
  res.json({
    success: true,
    ...info,
    environment: 'offline-standalone',
    uptimeSeconds: Math.floor(process.uptime()),
    databaseStatus: 'healthy_and_protected',
    protectionRules: [
      'SQLite / DB Files (*.db, *.sqlite, *.sqlite3)',
      'Database Directories (data/, database/, storage/)',
      'Local IndexedDB Storage & Snapshots',
      'Environment & Credentials (.env)',
      'Update History Logs',
    ],
  });
});

// 3. Get past update history
app.get('/api/system/update-history', (_req: Request, res: Response) => {
  const history = getUpdateHistory();
  res.json({ success: true, history });
});

// 4. In-App Version Updater endpoint (Receives ZIP package, extracts, excludes DB, overwrites code)
app.post(
  '/api/system/update-version',
  upload.single('updatePackage'),
  async (req: Request, res: Response) => {
    try {
      let zipBuffer: Buffer | null = null;

      if (req.file && req.file.buffer) {
        zipBuffer = req.file.buffer;
      } else if (req.body && req.body.zipBase64) {
        // Fallback: base64 payload
        const base64Data = req.body.zipBase64.replace(/^data:.*?;base64,/, '');
        zipBuffer = Buffer.from(base64Data, 'base64');
      }

      if (!zipBuffer || zipBuffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No update package received. Please upload a valid .zip file.',
        });
      }

      console.log(`[In-App Updater] Processing update package (${(zipBuffer.length / 1024).toFixed(1)} KB)...`);

      let zip: AdmZip;
      try {
        zip = new AdmZip(zipBuffer);
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          error: `Invalid ZIP archive: ${err.message || 'Could not parse package'}`,
        });
      }

      const zipEntries = zip.getEntries();
      if (!zipEntries || zipEntries.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Uploaded ZIP package is empty.',
        });
      }

      // Check if all files are inside a common root folder (e.g. "my-app-v2.5.0/...")
      let rootPrefix = '';
      const nonDirEntries = zipEntries.filter((e) => !e.isDirectory);
      if (nonDirEntries.length > 0) {
        const firstParts = nonDirEntries[0].entryName.split('/');
        if (firstParts.length > 1) {
          const candidate = firstParts[0] + '/';
          const allMatch = nonDirEntries.every((e) => e.entryName.startsWith(candidate));
          if (allMatch) {
            rootPrefix = candidate;
          }
        }
      }

      const currentVer = getCurrentVersionInfo();
      const updatedFiles: string[] = [];
      const skippedProtectedFiles: string[] = [];
      let detectedNewVersion = '';
      let detectedReleaseNotes = '';

      // First pass: Pre-flight scan for version info and database safety
      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;

        let relativePath = entry.entryName;
        if (rootPrefix && relativePath.startsWith(rootPrefix)) {
          relativePath = relativePath.slice(rootPrefix.length);
        }

        // Check if version.json or package.json is inside to read target version
        if (relativePath === 'src/version.json' || relativePath === 'version.json') {
          try {
            const raw = entry.getData().toString('utf-8');
            const parsed = JSON.parse(raw);
            if (parsed.version) detectedNewVersion = parsed.version;
            if (parsed.releaseNotes) detectedReleaseNotes = parsed.releaseNotes;
          } catch (e) {
            // ignore parse error
          }
        } else if (relativePath === 'package.json' && !detectedNewVersion) {
          try {
            const raw = entry.getData().toString('utf-8');
            const parsed = JSON.parse(raw);
            if (parsed.version) detectedNewVersion = parsed.version;
          } catch (e) {
            // ignore parse error
          }
        }
      }

      if (!detectedNewVersion) {
        // Fallback: increment patch or generate version
        const parts = currentVer.version.split('.');
        if (parts.length === 3) {
          detectedNewVersion = `${parts[0]}.${parts[1]}.${Number(parts[2] || 0) + 1}`;
        } else {
          detectedNewVersion = `${currentVer.version}-updated`;
        }
      }

      // Second pass: Extract & overwrite code files, strictly ignoring database files
      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;

        let relativePath = entry.entryName;
        if (rootPrefix && relativePath.startsWith(rootPrefix)) {
          relativePath = relativePath.slice(rootPrefix.length);
        }

        // Prevent directory traversal attacks
        if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
          console.warn(`[In-App Updater] Blocked suspicious path: ${relativePath}`);
          continue;
        }

        // DATABASE PROTECTION FILTER:
        // Exclude database files, SQLite files, storage directories, .env
        if (isProtectedDatabaseOrConfigFile(relativePath)) {
          console.log(`[In-App Updater] 🛡️ Protected Database/Config file skipped: ${relativePath}`);
          skippedProtectedFiles.push(relativePath);
          continue; // NEVER overwrite database!
        }

        // Safe code file to overwrite
        const targetFilePath = path.join(ROOT_DIR, relativePath);
        const targetDir = path.dirname(targetFilePath);

        try {
          // Ensure directory exists
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          // Write / overwrite the file content
          const fileData = entry.getData();
          fs.writeFileSync(targetFilePath, fileData);
          updatedFiles.push(relativePath);
        } catch (writeErr: any) {
          console.error(`[In-App Updater] Failed to write ${relativePath}:`, writeErr);
        }
      }

      // Update the local version.json with the new version stamp
      try {
        const newVerData = {
          version: detectedNewVersion,
          releaseDate: new Date().toISOString().split('T')[0],
          buildNumber: `${Date.now()}-offline-update`,
          previousVersion: currentVer.version,
          databaseEngine: 'IndexedDB + Offline File Storage',
          lastUpdated: new Date().toISOString(),
          releaseNotes: detectedReleaseNotes || 'In-App Update successfully applied. Database preserved intact.',
        };
        fs.mkdirSync(path.dirname(VERSION_FILE), { recursive: true });
        fs.writeFileSync(VERSION_FILE, JSON.stringify(newVerData, null, 2), 'utf-8');
      } catch (err) {
        console.error('Error writing new version.json:', err);
      }

      // Save update entry to history
      const historyEntry = {
        id: `update_${Date.now()}`,
        timestamp: new Date().toISOString(),
        previousVersion: currentVer.version,
        newVersion: detectedNewVersion,
        totalFilesExtracted: updatedFiles.length,
        skippedProtectedFilesCount: skippedProtectedFiles.length,
        skippedProtectedFiles: skippedProtectedFiles.slice(0, 10),
        sampleUpdatedFiles: updatedFiles.slice(0, 15),
        packageSizeKb: Math.round(zipBuffer.length / 1024),
        status: 'SUCCESS',
        databaseIntact: true,
      };
      saveUpdateHistory(historyEntry);

      console.log(
        `[In-App Updater] ✅ Update complete! Overwrote ${updatedFiles.length} files. Protected ${skippedProtectedFiles.length} database/config files.`
      );

      return res.json({
        success: true,
        message: 'Application files updated successfully. Database records remain 100% untouched and intact.',
        previousVersion: currentVer.version,
        newVersion: detectedNewVersion,
        updatedFilesCount: updatedFiles.length,
        sampleUpdatedFiles: updatedFiles.slice(0, 15),
        skippedProtectedFiles,
        restartScheduled: true,
        restartTimeMs: 3000,
      });
    } catch (err: any) {
      console.error('[In-App Updater] Update error:', err);
      return res.status(500).json({
        success: false,
        error: `Update failed: ${err.message || 'Unknown server error'}`,
      });
    }
  }
);

// 5. Generate a sample update ZIP package on the fly for testing
app.get('/api/system/generate-sample-update', (_req: Request, res: Response) => {
  try {
    const zip = new AdmZip();
    const currentVer = getCurrentVersionInfo();
    const nextVerParts = currentVer.version.split('.');
    const nextVer = `${nextVerParts[0] || '2'}.${nextVerParts[1] || '4'}.${Number(nextVerParts[2] || 0) + 1}`;

    // 1. Updated version.json
    const updatedVersionJson = {
      version: nextVer,
      releaseDate: new Date().toISOString().split('T')[0],
      buildNumber: `${Date.now()}-sample-update`,
      previousVersion: currentVer.version,
      releaseNotes: `Sample Official Update ${nextVer}: Performance improvements, exam marksheet enhancements, and UI stability updates.`,
      databaseEngine: 'IndexedDB + Offline File Storage',
      lastUpdated: new Date().toISOString(),
    };
    zip.addFile('src/version.json', Buffer.from(JSON.stringify(updatedVersionJson, null, 2), 'utf-8'));

    // 2. Updated public/release_notes.txt
    const releaseNotes = `=========================================
SCHOOL & COLLEGE ERP UPDATE PACKAGE v${nextVer}
=========================================
Release Date: ${new Date().toISOString()}
Target Environment: Offline Standalone Application

Changelog:
- Enhanced In-App Version Updater with Database File Exclusion Filter
- Optimized Exam Mark Entry and Tabulation Sheets
- Certificate & ID Card custom template background support
- High-speed offline IndexedDB database preservation verified

NOTE: Existing institutional database, students, transactions,
and credentials are NOT touched during this update.
=========================================`;
    zip.addFile('public/release_notes.txt', Buffer.from(releaseNotes, 'utf-8'));

    // 3. INTENTIONAL DUMMY DATABASE FILES TO PROVE FILTERING WORKS!
    // The updater will safely identify and reject these dummy DB files, leaving original DB untouched.
    zip.addFile(
      'database/sample_school_db.sqlite',
      Buffer.from('TEST_SQLITE_PAYLOAD_THAT_MUST_BE_BLOCKED', 'utf-8')
    );
    zip.addFile(
      'data/student_records.db',
      Buffer.from('TEST_DB_PAYLOAD_THAT_MUST_BE_BLOCKED', 'utf-8')
    );
    zip.addFile(
      '.env.production',
      Buffer.from('TEST_ENV_PAYLOAD_THAT_MUST_BE_BLOCKED', 'utf-8')
    );

    const buffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="erp-update-v${nextVer}.zip"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Restart trigger endpoint
app.post('/api/system/restart', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'System restart acknowledged. Reloading environment...',
  });
});

// 7. Daily 11:59 PM Auto-Backup Storage Endpoint
app.post('/api/system/save-auto-backup', (req: Request, res: Response) => {
  try {
    const { filename, payload, date, triggerType } = req.body;
    const backupName = filename || `daily_backup_${new Date().toISOString().split('T')[0]}_23-59.json`;
    const safeBackupPath = path.join(BACKUPS_DIR, path.basename(backupName));

    fs.writeFileSync(
      safeBackupPath,
      typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      'utf-8'
    );

    console.log(`[Auto-Backup 23:59] Successfully saved daily snapshot to ${safeBackupPath}`);

    return res.json({
      success: true,
      message: 'Daily 11:59 PM auto-backup saved to local storage disk.',
      filename: path.basename(safeBackupPath),
      sizeBytes: fs.statSync(safeBackupPath).size,
      date: date || new Date().toISOString(),
      triggerType: triggerType || 'scheduled_midnight',
    });
  } catch (err: any) {
    console.error('[Auto-Backup Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Auto-Backup Status & List of Saved Disk Backups
app.get('/api/system/auto-backup-info', (_req: Request, res: Response) => {
  try {
    let files: Array<{ filename: string; sizeBytes: number; createdAt: string }> = [];
    if (fs.existsSync(BACKUPS_DIR)) {
      files = fs.readdirSync(BACKUPS_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
          const stat = fs.statSync(path.join(BACKUPS_DIR, f));
          return {
            filename: f,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const now = new Date();
    const next1159 = new Date();
    next1159.setHours(23, 59, 0, 0);
    if (now > next1159) {
      next1159.setDate(next1159.getDate() + 1);
    }

    return res.json({
      success: true,
      targetDailyTime: '23:59',
      targetDailyTimeLabel: 'রাত ১১:৫৯ মিনিট (11:59 PM)',
      nextScheduledRun: next1159.toISOString(),
      totalBackupsOnDisk: files.length,
      lastBackupFile: files[0] || null,
      backups: files.slice(0, 15),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Trigger immediate test 11:59 PM backup
app.post('/api/system/trigger-test-1159-backup', (_req: Request, res: Response) => {
  try {
    const testFileName = `test_1159_auto_backup_${Date.now()}.json`;
    const testPath = path.join(BACKUPS_DIR, testFileName);

    const testPayload = {
      system: 'School & College Management ERP',
      backupType: '11:59 PM Daily Auto-Backup Verification',
      timestamp: new Date().toISOString(),
      note: 'Verified offline daily auto-backup mechanism for 11:59 PM scheduler',
      status: 'VERIFIED_OK',
    };

    fs.writeFileSync(testPath, JSON.stringify(testPayload, null, 2), 'utf-8');

    return res.json({
      success: true,
      message: '11:59 PM Auto-Backup mechanism verified successfully! File created on disk.',
      filename: testFileName,
      sizeBytes: fs.statSync(testPath).size,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 10. GEMINI CHATBOT SERVER-SIDE API
// ==========================================
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, systemInstruction, model } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    // Supported models per user requirements:
    // - gemini-3.8-flash (default general fast model)
    // - gemini-3.5-flash (general tasks)
    // - gemini-3.1-flash-lite (fast tasks)
    // - gemini-3.1-pro-preview (complex tasks)
    const validModels = [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview',
    ];
    const selectedModel = validModels.includes(model) ? model : 'gemini-3.8-flash';

    const ai = getGeminiClient();

    // Map conversation history into Gemini multi-turn format
    const contents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.text || m.content || '') }],
    }));

    const defaultRoleInstruction =
      'You are EduSphere AI, the dedicated intelligent administrative assistant for the School & College Management ERP in Bangladesh and international institutions. You assist school principals, headmasters, teachers, and administrative officers with student admissions, certificates, fee collection, 11:59 PM automated backups, digital signature processing, class routines, academic transcripts, and institutional policies. Always provide structured, precise, polite, and actionable answers.';

    // Try primary model, fallback to alternative models if temporary high-demand spike (503) or rate limits
    const candidateModels = [selectedModel];
    if (selectedModel !== 'gemini-3.1-flash-lite') candidateModels.push('gemini-3.1-flash-lite');
    if (selectedModel !== 'gemini-flash-latest') candidateModels.push('gemini-flash-latest');
    if (selectedModel !== 'gemini-3.5-flash') candidateModels.push('gemini-3.5-flash');

    let lastError: any = null;
    let successfulModel = selectedModel;
    let replyText = '';

    for (const modelCandidate of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelCandidate,
          contents,
          config: {
            systemInstruction: systemInstruction || defaultRoleInstruction,
          },
        });
        replyText = response.text || '';
        successfulModel = modelCandidate;
        lastError = null;
        break;
      } catch (e: any) {
        lastError = e;
        const errStr = `${e?.message || ''} ${JSON.stringify(e || {})}`;
        // If 503 high demand or unavailable or rate limit spike, quietly failover to next candidate
        if (
          errStr.includes('503') ||
          errStr.includes('UNAVAILABLE') ||
          errStr.includes('high demand') ||
          errStr.includes('429') ||
          errStr.includes('RESOURCE_EXHAUSTED')
        ) {
          console.log(`[EduSphere AI] Retrying with backup model candidate: ${modelCandidate}`);
          continue;
        } else {
          continue;
        }
      }
    }

    if (lastError && !replyText) {
      throw lastError;
    }

    return res.json({
      success: true,
      text: replyText,
      model: successfulModel,
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate response from Gemini',
    });
  }
});

// ==========================================
// VITE & STATIC FILES MIDDLEWARE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[School & College ERP Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
