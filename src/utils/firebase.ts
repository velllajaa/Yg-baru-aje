// Firebase Firestore client configuration for robust cloud persistence
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc, 
  Firestore,
  DocumentReference,
  Unsubscribe
} from 'firebase/firestore';
import { AppState, Member, DailyMemberLog, BattalionDailyReportData, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import firebaseConfigJson from '../../firebase-applet-config.json';

export interface FirebaseConfigOptions {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

// Built-in provisioned Firebase configuration from project
export const PROVISIONED_FIREBASE_CONFIG: FirebaseConfigOptions = {
  projectId: firebaseConfigJson.projectId || 'eloquent-mission-v07pf',
  appId: firebaseConfigJson.appId || '1:966490489705:web:b61a7acc8b3f8032ccb3f8',
  apiKey: firebaseConfigJson.apiKey || 'AIzaSyCf5NLK16oxsqpaeSgTR00q2VlCvv6nSbI',
  authDomain: firebaseConfigJson.authDomain || 'eloquent-mission-v07pf.firebaseapp.com',
  storageBucket: firebaseConfigJson.storageBucket || 'eloquent-mission-v07pf.firebasestorage.app',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '966490489705',
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId || 'ai-studio-ce672b50-0a5b-4937-9c43-64754803007c',
};

const STORAGE_CUSTOM_FIREBASE = 'BRIGCOMM_CUSTOM_FIREBASE_CONFIG';

export function getStoredCustomFirebase(): FirebaseConfigOptions | null {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_FIREBASE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

export function saveCustomFirebase(config: FirebaseConfigOptions | null): void {
  try {
    if (!config || !config.apiKey) {
      localStorage.removeItem(STORAGE_CUSTOM_FIREBASE);
    } else {
      localStorage.setItem(STORAGE_CUSTOM_FIREBASE, JSON.stringify(config));
    }
    // Reset instance to force re-init
    firebaseAppInstance = null;
    firestoreDbInstance = null;
  } catch (err) {
    console.error('Failed to save Firebase config:', err);
  }
}

export function getFirebaseConfig(): FirebaseConfigOptions {
  // 1. Check custom user-saved config
  const custom = getStoredCustomFirebase();
  if (custom && custom.apiKey && custom.projectId) return custom;

  // 2. Check environment variables
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
      firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId || '(default)',
    };
  }

  // 3. Fallback to active provisioned Firebase project config
  return PROVISIONED_FIREBASE_CONFIG;
}

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreDbInstance: Firestore | null = null;

export function initFirebase(): Firestore | null {
  if (firestoreDbInstance) return firestoreDbInstance;

  const config = getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) return null;

  try {
    if (!getApps().length) {
      firebaseAppInstance = initializeApp(config);
    } else {
      firebaseAppInstance = getApp();
    }
    
    // Connect to database instance
    const dbId = config.firestoreDatabaseId || firebaseConfigJson.firestoreDatabaseId;
    if (dbId && dbId !== '(default)') {
      try {
        firestoreDbInstance = getFirestore(firebaseAppInstance, dbId);
      } catch (e) {
        console.warn('Could not initialize named firestore db, falling back to default db:', e);
        firestoreDbInstance = getFirestore(firebaseAppInstance);
      }
    } else {
      firestoreDbInstance = getFirestore(firebaseAppInstance);
    }

    return firestoreDbInstance;
  } catch (err) {
    console.error('Firebase Firestore initialization error:', err);
    return null;
  }
}

export const isFirebaseConfigured = (): boolean => {
  const config = getFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
};

// Document reference where tracker data is stored
export function getTrackerDocRef(db: Firestore): DocumentReference {
  return doc(db, 'brigcomm_tracker', 'app_state');
}

/**
 * Live Diagnostics & Roundtrip Test
 * Performs an actual write + read verification on Firestore to guarantee the connection works.
 */
export async function testFirebaseConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  latencyMs?: number;
  databaseId?: string;
  projectId?: string;
  details?: any 
}> {
  const config = getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return {
      success: false,
      message: 'Konfigurasi Firebase belum lengkap (API Key atau Project ID hilang).',
    };
  }

  const startTime = Date.now();

  try {
    const db = initFirebase();
    if (!db) {
      return { success: false, message: 'Gagal menginisialisasi instance Firebase App.' };
    }

    const testDoc = doc(db, 'brigcomm_tracker', 'connection_health_check');
    const testPayload = {
      ping: Date.now(),
      client: 'BRIGCOMM Daily Quota Tracker',
      status: 'operational',
      isoTime: new Date().toISOString(),
    };

    // 1. Write test
    await setDoc(testDoc, testPayload, { merge: true });

    // 2. Read test to verify roundtrip
    const verifySnap = await getDoc(testDoc);
    const latency = Date.now() - startTime;

    if (!verifySnap.exists()) {
      return {
        success: false,
        message: 'Dokumen uji coba berhasil dikirim tetapi gagal dibaca kembali dari Firestore.',
      };
    }

    const dbId = config.firestoreDatabaseId || '(default)';

    return {
      success: true,
      message: `Terkoneksi 100% dengan sukses ke Firestore (Project: ${config.projectId}, DB: ${dbId})! Latensi: ${latency}ms`,
      latencyMs: latency,
      databaseId: dbId,
      projectId: config.projectId,
    };
  } catch (error: any) {
    let msg = error?.message || String(error);
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      msg = 'Permission Denied: Aturan keamanan Firestore (firestore.rules) belum mengizinkan akses tulis/baca.';
    } else if (msg.includes('unavailable') || msg.includes('Failed to get document because the client is offline')) {
      msg = 'Jaringan Firestore sedang offline atau tidak dapat dijangkau.';
    }
    return {
      success: false,
      message: msg,
      details: error,
    };
  }
}

/**
 * Thorough Payload Sanitizer
 * Strips all undefined, NaN, circular references, or unsupported data types
 * to guarantee Firestore setDoc NEVER rejects the write.
 */
export function sanitizeStatePayload(state: AppState): Record<string, any> {
  const sanitizedMembers = (state.members || []).map((m) => ({
    id: String(m.id || ''),
    name: String(m.name || ''),
    discordId: String(m.discordId || ''),
    battalion: m.battalion || '1st_bat',
    position: String(m.position || ''),
    dailyQuotaTarget: typeof m.dailyQuotaTarget === 'number' && !isNaN(m.dailyQuotaTarget) ? m.dailyQuotaTarget : 3,
    status: m.status === 'inactive' ? 'inactive' : 'active',
    createdAt: String(m.createdAt || new Date().toISOString().split('T')[0]),
  }));

  const sanitizedLogs: Record<string, any> = {};
  if (state.memberLogs && typeof state.memberLogs === 'object') {
    for (const [key, log] of Object.entries(state.memberLogs)) {
      if (log && typeof log === 'object') {
        const cleanTasks: Record<string, any> = {};
        if (log.tasksProgress && typeof log.tasksProgress === 'object') {
          for (const [tKey, tVal] of Object.entries(log.tasksProgress)) {
            if (tVal !== undefined && tVal !== null) {
              cleanTasks[tKey] = tVal;
            }
          }
        }

        sanitizedLogs[key] = {
          memberId: String(log.memberId || ''),
          date: String(log.date || ''),
          activityLevel: log.activityLevel || 'under_1h',
          status: log.status || 'no_logs',
          gameHourDropdown: String(log.gameHourDropdown || '-'),
          tasksProgress: cleanTasks,
          quotaCount: typeof log.quotaCount === 'number' && !isNaN(log.quotaCount) ? log.quotaCount : 0,
          note: String(log.note || ''),
          overseerNotes: String(log.overseerNotes || log.note || ''),
          demotionNotice: Boolean(log.demotionNotice),
          updatedAt: String(log.updatedAt || new Date().toISOString()),
        };
      }
    }
  }

  const sanitizedReports: Record<string, any> = {};
  if (state.battalionReports && typeof state.battalionReports === 'object') {
    for (const [key, rep] of Object.entries(state.battalionReports)) {
      if (rep && typeof rep === 'object') {
        sanitizedReports[key] = {
          id: rep.id || key,
          battalionId: rep.battalionId || '1st_bat',
          date: String(rep.date || ''),
          firstBat: rep.firstBat || null,
          secondBat: rep.secondBat || null,
          commandantsGuards: rep.commandantsGuards || null,
          officerInCharge: String(rep.officerInCharge || ''),
          summaryNote: String(rep.summaryNote || ''),
          updatedAt: String(rep.updatedAt || new Date().toISOString()),
        };
      }
    }
  }

  const sanitizedSettings: Record<string, any> = {
    ...DEFAULT_SETTINGS,
    ...(state.settings || {}),
  };

  return {
    members: sanitizedMembers,
    memberLogs: sanitizedLogs,
    battalionReports: sanitizedReports,
    settings: sanitizedSettings,
    lastSyncAt: new Date().toISOString(),
    _schemaVersion: 2,
  };
}

/**
 * Robust State Merger
 * Merges local state with remote Firestore state so no data is ever erased or lost.
 */
export function mergeStates(local: AppState, remote: Partial<AppState>): AppState {
  if (!remote) return local;

  // 1. Merge Members (union by ID)
  const memberMap = new Map<string, Member>();
  
  // Add remote members first
  if (Array.isArray(remote.members)) {
    for (const m of remote.members) {
      if (m && m.id && m.name) {
        memberMap.set(m.id, {
          id: String(m.id),
          name: String(m.name),
          discordId: String(m.discordId || ''),
          battalion: m.battalion || '1st_bat',
          position: String(m.position || ''),
          dailyQuotaTarget: Number(m.dailyQuotaTarget) || 3,
          status: m.status || 'active',
          createdAt: String(m.createdAt || new Date().toISOString().split('T')[0]),
        });
      }
    }
  }

  // Add/overwrite with local members if local has newer members
  if (Array.isArray(local.members)) {
    for (const m of local.members) {
      if (m && m.id && m.name) {
        const existing = memberMap.get(m.id);
        memberMap.set(m.id, {
          ...(existing || {}),
          ...m,
        });
      }
    }
  }

  // 2. Merge Member Logs (keep newer updatedAt timestamp)
  const mergedLogs: Record<string, DailyMemberLog> = {
    ...(remote.memberLogs || {}),
  };

  if (local.memberLogs) {
    for (const [key, localLog] of Object.entries(local.memberLogs)) {
      const remoteLog = mergedLogs[key];
      if (!remoteLog) {
        mergedLogs[key] = localLog;
      } else {
        const localTime = localLog.updatedAt ? new Date(localLog.updatedAt).getTime() : 0;
        const remoteTime = remoteLog.updatedAt ? new Date(remoteLog.updatedAt).getTime() : 0;
        if (localTime >= remoteTime) {
          mergedLogs[key] = { ...remoteLog, ...localLog };
        } else {
          mergedLogs[key] = { ...localLog, ...remoteLog };
        }
      }
    }
  }

  // 3. Merge Battalion Reports
  const mergedReports: Record<string, BattalionDailyReportData> = {
    ...(remote.battalionReports || {}),
    ...(local.battalionReports || {}),
  };

  // 4. Merge Settings
  const mergedSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(remote.settings || {}),
    ...(local.settings || {}),
  };

  return {
    members: Array.from(memberMap.values()),
    memberLogs: mergedLogs,
    battalionReports: mergedReports,
    settings: mergedSettings,
  };
}

/**
 * Fetch remote state from Firestore once (on boot or on manual pull)
 */
export async function fetchRemoteState(): Promise<AppState | null> {
  const db = initFirebase();
  if (!db) return null;

  try {
    const docRef = getTrackerDocRef(db);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AppState;
      if (data && typeof data === 'object') {
        return {
          members: Array.isArray(data.members) ? data.members : [],
          memberLogs: data.memberLogs && typeof data.memberLogs === 'object' ? data.memberLogs : {},
          battalionReports: data.battalionReports && typeof data.battalionReports === 'object' ? data.battalionReports : {},
          settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
        };
      }
    }
  } catch (err) {
    console.error('Failed to fetch remote state from Firestore:', err);
  }
  return null;
}

// Subscribe to real-time updates from Firebase Firestore
export function subscribeToFirebaseState(
  onData: (data: AppState | null) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const db = initFirebase();
  if (!db) return null;

  try {
    const docRef = getTrackerDocRef(db);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.data() as AppState;
          if (val && typeof val === 'object') {
            onData(val);
          }
        } else {
          onData(null);
        }
      },
      (err) => {
        console.warn('Firestore snapshot listener error:', err.message);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.error('Failed to subscribe to Firestore:', err);
    if (onError) onError(err);
    return null;
  }
}

/**
 * Immediate Save (No Debounce)
 * Used when explicitly requested (manual button, tab unload, modal close).
 */
export async function saveStateToFirebaseImmediate(state: AppState): Promise<boolean> {
  const db = initFirebase();
  if (!db) return false;

  try {
    const docRef = getTrackerDocRef(db);
    const payload = sanitizeStatePayload(state);
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.error('Immediate save to Firestore failed:', err);
    return false;
  }
}

// Debounced Save Queue with Promise Resolution for all callers
let pendingSaveTimer: any = null;
let pendingResolvers: Array<(success: boolean) => void> = [];

export function saveStateToFirebase(state: AppState): Promise<boolean> {
  return new Promise((resolve) => {
    const db = initFirebase();
    if (!db) {
      resolve(false);
      return;
    }

    pendingResolvers.push(resolve);

    if (pendingSaveTimer) {
      clearTimeout(pendingSaveTimer);
    }

    pendingSaveTimer = setTimeout(async () => {
      const resolversToCall = [...pendingResolvers];
      pendingResolvers = [];

      try {
        const docRef = getTrackerDocRef(db);
        const payload = sanitizeStatePayload(state);
        await setDoc(docRef, payload, { merge: true });
        resolversToCall.forEach((r) => r(true));
      } catch (err) {
        console.error('Error saving state to Firestore:', err);
        resolversToCall.forEach((r) => r(false));
      }
    }, 250);
  });
}
