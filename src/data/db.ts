import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { firestoreDb } from '../lib/firebase';
import {
  ScreeningRecord,
  ScreeningToolId,
  PersonalDetails,
  MedicalScreening,
  HtsScreening,
  SubstanceUseScreening,
  PsychosocialScreening,
  ConsentRecord,
  ClinicalActionPlan,
} from '../types';
import { DEFAULT_PSYCHOSOCIAL_SYMPTOMS, calculatePsychosocialAnalysis } from '../utils/psychosocial';

const COLLECTION_NAME = 'outreach_records';
const DB_NAME = 'DunwellCojOutreachDB_Live_v1';
const DB_VERSION = 1;
const STORE_NAME = 'outreach_records';
const LOCAL_STORAGE_BACKUP_KEY = 'dunwell_coj_outreach_live_records_v1';

export const ALL_SCREENING_TOOLS: { id: ScreeningToolId; name: string; stepNumber: number }[] = [
  { id: 'personal', name: '1. Personal Details & Demographics', stepNumber: 1 },
  { id: 'vitals', name: '2. Vitals Signs and HTS Screening', stepNumber: 2 },
  { id: 'substance', name: '3. Substance & Rehab Screening', stepNumber: 3 },
  { id: 'psychosocial', name: '4. Psychosocial / Mental Health (Tick Form)', stepNumber: 4 },
  { id: 'actionPlan', name: '5. Shelter, Social Support & Reintegration Plan', stepNumber: 5 },
];

// Helper to filter out legacy dummy records
function isDummyRecord(rec: ScreeningRecord): boolean {
  if (!rec || !rec.id) return true;
  if (rec.id.startsWith('rec-00')) return true;
  const name = rec.personal?.fullName?.toLowerCase() || '';
  if (
    name.includes('sipho bongani') ||
    name.includes('lerato precious') ||
    name.includes('kabelo') ||
    name.includes('wayne') ||
    name.includes('thabo') ||
    name.includes('priya') ||
    name.includes('mpho') ||
    name.includes('johan')
  ) {
    return true;
  }
  return false;
}

/**
 * Deduplicates an array of screening records by client full name (case-insensitive, trimmed).
 * When duplicate names exist, retains the most complete record (most completed tools),
 * breaking ties with the most recent update timestamp.
 */
export function deduplicateRecordsByName(records: ScreeningRecord[]): ScreeningRecord[] {
  const map = new Map<string, ScreeningRecord>();

  for (const rec of records) {
    if (!rec || !rec.personal?.fullName) continue;
    const key = rec.personal.fullName.trim().toLowerCase();
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, rec);
    } else {
      const existingScore =
        (existing.completedTools?.length || 0) * 10 +
        (existing.isFullyCompleted ? 50 : 0) +
        (existing.consent?.clientSignatureDataUrl ? 5 : 0);
      const currentScore =
        (rec.completedTools?.length || 0) * 10 +
        (rec.isFullyCompleted ? 50 : 0) +
        (rec.consent?.clientSignatureDataUrl ? 5 : 0);

      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const currentTime = new Date(rec.updatedAt || rec.createdAt || 0).getTime();

      if (
        currentScore > existingScore ||
        (currentScore === existingScore && currentTime > existingTime)
      ) {
        map.set(key, rec);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

// In-memory cache for ultra-fast synchronous rendering
let memoryRecordsCache: ScreeningRecord[] = [];
let isDbInitialized = false;
let isFirestoreListening = false;
let syncStatus: 'connected' | 'connecting' | 'offline' = 'connecting';

type DatabaseChangeListener = (records: ScreeningRecord[]) => void;
type SyncStatusListener = (status: 'connected' | 'connecting' | 'offline') => void;

const listeners: Set<DatabaseChangeListener> = new Set();
const syncListeners: Set<SyncStatusListener> = new Set();

export function getSyncStatus(): 'connected' | 'connecting' | 'offline' {
  return syncStatus;
}

export function subscribeToSyncStatus(listener: SyncStatusListener): () => void {
  syncListeners.add(listener);
  listener(syncStatus);
  return () => {
    syncListeners.delete(listener);
  };
}

function updateSyncStatus(status: 'connected' | 'connecting' | 'offline') {
  syncStatus = status;
  syncListeners.forEach((l) => {
    try {
      l(status);
    } catch (e) {
      console.error(e);
    }
  });
}

// Open IndexedDB database for local offline fallback
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Normalize record shape
function normalizeRecord(rec: any): ScreeningRecord {
  const tools: ScreeningToolId[] = rec.completedTools && Array.isArray(rec.completedTools)
    ? [...rec.completedTools]
    : ['personal', 'vitals', 'substance', 'psychosocial', 'actionPlan'];

  return {
    ...rec,
    actionPlan: Object.assign(
      {
        shelterPreferenceNotes: '',
        childrenCount: 0,
        childrenAges: '',
        counselingFocusAreas: [],
        counselingDetails: '',
        shelterFrequency: 'Never',
        shelterReasonForLeaving: '',
        skillsInterestAreas: [],
        immediateIntervention: ['Routine Outreach Assessment'],
        triageLevel: 'Routine / Stable',
        wantsCojShelter: 'No',
        hasChildrenOnStreets: 'No',
        needsClinicalPsychosocialCounseling: 'No',
        stayedAtCojShelterBefore: 'No',
        interestedInSkillsDevelopment: 'No',
      },
      rec.actionPlan || {}
    ) as ClinicalActionPlan,
    completedTools: tools,
    isFullyCompleted: tools.length >= 5,
  };
}

// Save memory cache to IndexedDB and localStorage (local cache layer)
async function persistLocalCache(records: ScreeningRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('localStorage persist error:', err);
  }

  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const record of records) {
      store.put(record);
    }
    tx.oncomplete = () => {
      db.close();
    };
  } catch (err) {
    console.warn('IndexedDB write error:', err);
  }
}

function notifyListeners() {
  const recordsCopy = [...memoryRecordsCache];
  listeners.forEach((listener) => {
    try {
      listener(recordsCopy);
    } catch (e) {
      console.error('Error in database change listener:', e);
    }
  });
}

export function subscribeToDatabase(listener: DatabaseChangeListener): () => void {
  listeners.add(listener);
  if (isDbInitialized) {
    listener([...memoryRecordsCache]);
  }
  return () => {
    listeners.delete(listener);
  };
}

// Helper: Sanitize object for Firestore (convert undefined values to null or omit them)
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
}

// Start real-time Firestore database synchronization across all devices
function startFirestoreListener() {
  if (isFirestoreListening) return;
  isFirestoreListening = true;
  updateSyncStatus('connecting');

  const recordsCol = collection(firestoreDb, COLLECTION_NAME);

  onSnapshot(
    recordsCol,
    (snapshot) => {
      updateSyncStatus('connected');
      const remoteRecords: ScreeningRecord[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id && !isDummyRecord(data as ScreeningRecord)) {
          remoteRecords.push(normalizeRecord(data));
        }
      });

      // Find redundant duplicate records with identical names to purge from Firestore
      const nameToBestId = new Map<string, string>();
      const deduped = deduplicateRecordsByName(remoteRecords);
      deduped.forEach((r) => {
        const key = r.personal?.fullName?.trim().toLowerCase();
        if (key) nameToBestId.set(key, r.id);
      });

      // Asynchronously prune obsolete duplicate documents in Firestore
      remoteRecords.forEach(async (r) => {
        const key = r.personal?.fullName?.trim().toLowerCase();
        if (key && nameToBestId.has(key) && nameToBestId.get(key) !== r.id) {
          try {
            await deleteDoc(doc(firestoreDb, COLLECTION_NAME, r.id));
          } catch (e) {
            console.warn('Pruning duplicate record error:', e);
          }
        }
      });

      memoryRecordsCache = deduped;
      isDbInitialized = true;
      persistLocalCache(deduped);
      notifyListeners();
    },
    (error) => {
      console.warn('Firestore live listener error, running in local cached mode:', error);
      updateSyncStatus('offline');
    }
  );
}

// Initialize database: loads local cache instantly, then connects to Cloud Firestore
export async function initDatabase(): Promise<ScreeningRecord[]> {
  // Purge any legacy mock storage keys
  try {
    localStorage.removeItem('dunwell_coj_outreach_db_records_v4');
    localStorage.removeItem('dunwell_coj_outreach_records_v3');
  } catch {}

  // 1. First populate from localStorage / IndexedDB so UI responds with zero delay
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        memoryRecordsCache = deduplicateRecordsByName(
          parsed.filter((r) => !isDummyRecord(r)).map(normalizeRecord)
        );
        isDbInitialized = true;
        notifyListeners();
      }
    }
  } catch (e) {
    console.warn('Local storage read error:', e);
  }

  // 2. Start real-time multi-device Firestore listener
  try {
    startFirestoreListener();
  } catch (e) {
    console.error('Failed to start Firestore listener:', e);
    updateSyncStatus('offline');
  }

  return memoryRecordsCache;
}

export function getCachedRecords(): ScreeningRecord[] {
  if (!isDbInitialized) {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          memoryRecordsCache = deduplicateRecordsByName(
            parsed.filter((r) => !isDummyRecord(r)).map(normalizeRecord)
          );
          return memoryRecordsCache;
        }
      }
    } catch {}
    memoryRecordsCache = [];
  }
  return deduplicateRecordsByName(memoryRecordsCache.filter((r) => !isDummyRecord(r)));
}

export function getRecordById(id: string): ScreeningRecord | undefined {
  return memoryRecordsCache.find((r) => r.id === id);
}

// Default blank structures for a newly enrolled person
export function createBlankRecord(
  personal: PersonalDetails,
  meta: { outreachSite: string; screenerName: string }
): ScreeningRecord {
  const uniqueId = 'rec-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  const refNum = `COJ-DUN-2026-${Math.floor(100 + Math.random() * 900)}`;
  const defaultPsychAnalysis = calculatePsychosocialAnalysis(DEFAULT_PSYCHOSOCIAL_SYMPTOMS);

  return {
    id: uniqueId,
    refNumber: refNum,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    outreachSite: meta.outreachSite,
    screenerName: meta.screenerName,
    personal: { ...personal },
    medical: {
      vitals: {
        pulseRate: 75,
        pulseRhythm: 'regular',
        oxygenSaturation: 98,
        bloodPressureSys: 120,
        bloodPressureDia: 80,
        map: 93,
        weightKg: 65,
        heightCm: 170,
        bmi: 22.5,
        vitalsOutcome: 'NORMAL',
        actionTakenNotes: '',
      },
      chronicConditions: ['None'],
      presentComplaints: ['None / General Checkup'],
      tbScreeningSymptomatic: false,
    },
    hts: {
      hivStatusKnown: 'No',
      acceptHtsTest: 'Yes',
      testResult: 'Not Done',
      onArt: 'Not Applicable (HIV Negative)',
      prepOffered: false,
      condomsDistributed: 0,
      referral: 'No',
      referralFacility: '',
      adherence: '',
      medicationLocation: '',
    },
    substance: {
      alcoholUseFrequency: 'None / Abstinent',
      drugUseFrequency: 'Never',
      substanceTypes: ['None'],
      injectingDrugUse: false,
      interestInRehabSupport: 'No / Not interested',
      referralRequested: false,
    },
    psychosocial: {
      symptoms: { ...DEFAULT_PSYCHOSOCIAL_SYMPTOMS },
      analysis: defaultPsychAnalysis,
      counselingAccepted: false,
      socialWorkerReferral: false,
      safetyPlanInitiated: false,
    },
    actionPlan: {
      wantsCojShelter: 'No',
      shelterPreferenceNotes: '',
      hasChildrenOnStreets: 'No',
      childrenCount: 0,
      childrenAges: '',
      needsClinicalPsychosocialCounseling: 'No',
      counselingFocusAreas: [],
      counselingDetails: '',
      stayedAtCojShelterBefore: 'No',
      shelterFrequency: 'Never',
      shelterReasonForLeaving: '',
      interestedInSkillsDevelopment: 'No',
      skillsInterestAreas: [],
      immediateIntervention: ['Routine Outreach Assessment'],
      triageLevel: 'Routine / Stable',
    },
    completedTools: ['personal'],
    isFullyCompleted: false,
  };
}

// 1. SAVE PERSONAL DETAILS (Enroll or update person)
export async function savePersonDetails(
  personal: PersonalDetails,
  meta: { outreachSite: string; screenerName: string; existingRecordId?: string }
): Promise<ScreeningRecord> {
  let record: ScreeningRecord;

  // If no explicit ID was supplied, check if someone with this exact name already exists
  if (!meta.existingRecordId && personal.fullName) {
    const norm = personal.fullName.trim().toLowerCase();
    const match = memoryRecordsCache.find(
      (r) => r.personal?.fullName?.trim().toLowerCase() === norm
    );
    if (match) {
      meta.existingRecordId = match.id;
    }
  }

  if (meta.existingRecordId) {
    const existing = memoryRecordsCache.find((r) => r.id === meta.existingRecordId);
    if (existing) {
      const tools = new Set(existing.completedTools || []);
      tools.add('personal');
      record = {
        ...existing,
        updatedAt: new Date().toISOString(),
        outreachSite: meta.outreachSite || existing.outreachSite,
        screenerName: meta.screenerName || existing.screenerName,
        personal: { ...personal },
        completedTools: Array.from(tools) as ScreeningToolId[],
        isFullyCompleted: tools.size >= 5,
      };
    } else {
      record = createBlankRecord(personal, meta);
    }
  } else {
    record = createBlankRecord(personal, meta);
  }

  // Optimistically update local memory cache and storage
  const exists = memoryRecordsCache.findIndex((r) => r.id === record.id);
  if (exists >= 0) {
    memoryRecordsCache[exists] = record;
  } else {
    memoryRecordsCache = [record, ...memoryRecordsCache];
  }
  memoryRecordsCache = deduplicateRecordsByName(memoryRecordsCache);
  await persistLocalCache(memoryRecordsCache);
  notifyListeners();

  // Persist directly to Firestore database for instant cross-device sync
  try {
    const docRef = doc(firestoreDb, COLLECTION_NAME, record.id);
    await setDoc(docRef, sanitizeForFirestore(record), { merge: true });
    updateSyncStatus('connected');
  } catch (err) {
    console.error('Error saving person to Firestore cloud database:', err);
    updateSyncStatus('offline');
  }

  return record;
}

// 2. SAVE TOOL FOR PERSON (Vitals, HTS, Psychosocial, Action Plan)
export async function saveToolForPerson(
  personId: string,
  toolId: ScreeningToolId,
  toolData: {
    medical?: MedicalScreening;
    hts?: HtsScreening;
    substance?: SubstanceUseScreening;
    psychosocial?: PsychosocialScreening;
    actionPlan?: ClinicalActionPlan;
  }
): Promise<ScreeningRecord> {
  const index = memoryRecordsCache.findIndex((r) => r.id === personId);
  if (index === -1) {
    throw new Error(`Person with ID ${personId} was not found in database.`);
  }

  const existing = memoryRecordsCache[index];
  const toolsSet = new Set<ScreeningToolId>(existing.completedTools || []);
  toolsSet.add(toolId);
  if (toolId === 'vitals') {
    toolsSet.add('hts');
  }

  const updatedRecord: ScreeningRecord = {
    ...existing,
    updatedAt: new Date().toISOString(),
    ...(toolData.medical ? { medical: toolData.medical } : {}),
    ...(toolData.hts ? { hts: toolData.hts } : {}),
    ...(toolData.substance ? { substance: toolData.substance } : {}),
    ...(toolData.psychosocial ? { psychosocial: toolData.psychosocial } : {}),
    ...(toolData.actionPlan ? { actionPlan: toolData.actionPlan } : {}),
    completedTools: Array.from(toolsSet),
    isFullyCompleted: toolsSet.size >= 5,
  };

  // Optimistic local update
  memoryRecordsCache[index] = updatedRecord;
  await persistLocalCache(memoryRecordsCache);
  notifyListeners();

  // Cloud Firestore sync across devices
  try {
    const docRef = doc(firestoreDb, COLLECTION_NAME, updatedRecord.id);
    await setDoc(docRef, sanitizeForFirestore(updatedRecord), { merge: true });
    updateSyncStatus('connected');
  } catch (err) {
    console.error('Error updating tool in Firestore cloud database:', err);
    updateSyncStatus('offline');
  }

  return updatedRecord;
}

// 3. SAVE FULL RECORD (Complete Screening or whole record save)
export async function saveFullRecord(record: ScreeningRecord): Promise<ScreeningRecord> {
  const tools = new Set<ScreeningToolId>(record.completedTools || []);
  ALL_SCREENING_TOOLS.forEach((t) => tools.add(t.id));

  const normalized: ScreeningRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
    completedTools: Array.from(tools),
    isFullyCompleted: true,
  };

  const existingIdx = memoryRecordsCache.findIndex((r) => r.id === normalized.id);
  if (existingIdx >= 0) {
    memoryRecordsCache[existingIdx] = normalized;
  } else {
    memoryRecordsCache = [normalized, ...memoryRecordsCache];
  }

  await persistLocalCache(memoryRecordsCache);
  notifyListeners();

  // Cloud Firestore push
  try {
    const docRef = doc(firestoreDb, COLLECTION_NAME, normalized.id);
    await setDoc(docRef, sanitizeForFirestore(normalized), { merge: true });
    updateSyncStatus('connected');
  } catch (err) {
    console.error('Error saving full record to Firestore cloud database:', err);
    updateSyncStatus('offline');
  }

  return normalized;
}

// Get persons who need a specific screening tool
export function getPendingPersonsForTool(toolId: ScreeningToolId): ScreeningRecord[] {
  return memoryRecordsCache.filter((r) => {
    return !r.completedTools || !r.completedTools.includes(toolId);
  });
}

// Get persons who have already completed a specific tool
export function getCompletedPersonsForTool(toolId: ScreeningToolId): ScreeningRecord[] {
  return memoryRecordsCache.filter((r) => {
    return r.completedTools && r.completedTools.includes(toolId);
  });
}

// Delete record
export async function deleteRecord(recordId: string): Promise<void> {
  memoryRecordsCache = memoryRecordsCache.filter((r) => r.id !== recordId);
  await persistLocalCache(memoryRecordsCache);
  notifyListeners();

  try {
    const docRef = doc(firestoreDb, COLLECTION_NAME, recordId);
    await deleteDoc(docRef);
    updateSyncStatus('connected');
  } catch (err) {
    console.error('Error deleting record from Firestore cloud database:', err);
    updateSyncStatus('offline');
  }
}

// Reset database - clears records from both cloud Firestore and local storage
export async function resetDatabase(): Promise<ScreeningRecord[]> {
  const currentIds = memoryRecordsCache.map((r) => r.id);
  memoryRecordsCache = [];
  await persistLocalCache([]);
  notifyListeners();

  try {
    const batch = writeBatch(firestoreDb);
    for (const id of currentIds) {
      const docRef = doc(firestoreDb, COLLECTION_NAME, id);
      batch.delete(docRef);
    }
    await batch.commit();
    updateSyncStatus('connected');
  } catch (err) {
    console.error('Error clearing Firestore cloud records:', err);
  }

  return [];
}
