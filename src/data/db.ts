import { ScreeningRecord, ScreeningToolId, PersonalDetails, MedicalScreening, HtsScreening, SubstanceUseScreening, PsychosocialScreening, ConsentRecord, ClinicalActionPlan } from '../types';
import { INITIAL_OUTREACH_RECORDS } from './mockData';
import { DEFAULT_PSYCHOSOCIAL_SYMPTOMS, calculatePsychosocialAnalysis } from '../utils/psychosocial';

const DB_NAME = 'DunwellCojOutreachDB_Live_v1';
const DB_VERSION = 1;
const STORE_NAME = 'outreach_records';
const LOCAL_STORAGE_BACKUP_KEY = 'dunwell_coj_outreach_live_records_v1';

export const ALL_SCREENING_TOOLS: { id: ScreeningToolId; name: string; stepNumber: number }[] = [
  { id: 'personal', name: '1. Personal Details & Demographics', stepNumber: 1 },
  { id: 'vitals', name: '2. Vitals Signs (Record Measurements)', stepNumber: 2 },
  { id: 'hts', name: '3. HTS / HIV Screening', stepNumber: 3 },
  { id: 'substance', name: '4. Substance & Rehab Screening', stepNumber: 4 },
  { id: 'psychosocial', name: '5. Psychosocial / Mental Health (Tick Form)', stepNumber: 5 },
  { id: 'actionPlan', name: '6. Clinical Action Plan & Referrals', stepNumber: 6 },
];

// Helper to filter out any legacy dummy records that might have been saved in browser storage
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

// In-memory cache for synchronous rendering
let memoryRecordsCache: ScreeningRecord[] = [];
let isDbInitialized = false;
type DatabaseChangeListener = (records: ScreeningRecord[]) => void;
const listeners: Set<DatabaseChangeListener> = new Set();


// Open IndexedDB database
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

// Ensure all records have completedTools populated
function normalizeRecord(rec: ScreeningRecord): ScreeningRecord {
  const tools: ScreeningToolId[] = rec.completedTools && Array.isArray(rec.completedTools)
    ? [...rec.completedTools]
    : ['personal', 'vitals', 'hts', 'psychosocial', 'actionPlan'];

  return {
    ...rec,
    completedTools: tools,
    isFullyCompleted: tools.length >= 5,
  };
}

// Persist memory cache to both IndexedDB and localStorage
async function persistRecords(records: ScreeningRecord[]) {
  // Update memory
  memoryRecordsCache = [...records];

  // 1. Backup to localStorage for instant synchronous safety
  try {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('localStorage persist error:', err);
  }

  // 2. Persist to IndexedDB
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Clear and put all
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

  // 3. Notify all reactive subscribers
  notifyListeners();
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
  // Call immediately with current cache
  if (isDbInitialized) {
    listener([...memoryRecordsCache]);
  }
  return () => {
    listeners.delete(listener);
  };
}

// Initialize database
export async function initDatabase(): Promise<ScreeningRecord[]> {
  // Purge legacy storage keys that had mock records
  try {
    localStorage.removeItem('dunwell_coj_outreach_db_records_v4');
    localStorage.removeItem('dunwell_coj_outreach_records_v3');
  } catch {}

  if (isDbInitialized && memoryRecordsCache.length > 0) {
    memoryRecordsCache = memoryRecordsCache.filter((r) => !isDummyRecord(r));
    return memoryRecordsCache;
  }

  // Try loading from IndexedDB first
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getAllReq = store.getAll();

    const dbRecords = await new Promise<ScreeningRecord[]>((resolve, reject) => {
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });
    db.close();

    if (dbRecords && Array.isArray(dbRecords)) {
      const realRecords = dbRecords.filter((r) => !isDummyRecord(r)).map(normalizeRecord);
      memoryRecordsCache = realRecords;
      isDbInitialized = true;
      await persistRecords(realRecords);
      notifyListeners();
      return memoryRecordsCache;
    }
  } catch (e) {
    console.warn('Could not read from IndexedDB, checking localStorage:', e);
  }

  // Try localStorage backup
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const realRecords = parsed.filter((r) => !isDummyRecord(r)).map(normalizeRecord);
        memoryRecordsCache = realRecords;
        isDbInitialized = true;
        await persistRecords(realRecords);
        notifyListeners();
        return memoryRecordsCache;
      }
    }
  } catch (e) {
    console.warn('Could not read localStorage backup:', e);
  }

  // Live outreach starts with 0 dummy records
  memoryRecordsCache = [];
  await persistRecords([]);
  isDbInitialized = true;
  return [];
}

// Synchronous getter for memory cache
export function getCachedRecords(): ScreeningRecord[] {
  if (!isDbInitialized) {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          memoryRecordsCache = parsed.filter((r) => !isDummyRecord(r)).map(normalizeRecord);
          return memoryRecordsCache;
        }
      }
    } catch {}
    memoryRecordsCache = [];
  }
  return memoryRecordsCache.filter((r) => !isDummyRecord(r));
}

// Get single record
export function getRecordById(id: string): ScreeningRecord | undefined {
  return memoryRecordsCache.find((r) => r.id === id);
}

// Default blank structures for a newly enrolled person

export function createBlankRecord(personal: PersonalDetails, meta: { outreachSite: string; screenerName: string }): ScreeningRecord {
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
      immediateIntervention: ['Routine Outreach Assessment'],
      triageLevel: 'Routine / Stable',
    },
    completedTools: ['personal'], // Personal details completed on enrollment!
    isFullyCompleted: false,
  };
}

// 1. SAVE PERSONAL DETAILS (Enroll or update person)
export async function savePersonDetails(
  personal: PersonalDetails,
  meta: { outreachSite: string; screenerName: string; existingRecordId?: string }
): Promise<ScreeningRecord> {
  let record: ScreeningRecord;

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
      const updated = memoryRecordsCache.map((r) => (r.id === record.id ? record : r));
      await persistRecords(updated);
      return record;
    }
  }

  // Brand new person enrolled
  record = createBlankRecord(personal, meta);
  const updated = [record, ...memoryRecordsCache];
  await persistRecords(updated);
  return record;
}

// 2. SAVE TOOL FOR PERSON (Vitals, HTS, Psychosocial, Action Plan)
// Marks the tool as completed for that person and updates their record in the database
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

  const updatedRecord: ScreeningRecord = {
    ...existing,
    updatedAt: new Date().toISOString(),
    ...(toolData.medical ? { medical: toolData.medical } : {}),
    ...(toolData.hts ? { hts: toolData.hts } : {}),
    ...(toolData.substance ? { substance: toolData.substance } : {}),
    ...(toolData.psychosocial ? { psychosocial: toolData.psychosocial } : {}),
    ...(toolData.actionPlan ? { actionPlan: toolData.actionPlan } : {}),
    completedTools: Array.from(toolsSet),
    isFullyCompleted: toolsSet.size >= 6,
  };

  const newRecords = [...memoryRecordsCache];
  newRecords[index] = updatedRecord;
  await persistRecords(newRecords);
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
  let updated: ScreeningRecord[];
  if (existingIdx >= 0) {
    updated = [...memoryRecordsCache];
    updated[existingIdx] = normalized;
  } else {
    updated = [normalized, ...memoryRecordsCache];
  }

  await persistRecords(updated);
  return normalized;
}

// Get persons who need a specific screening tool (for the dropdown)
// "after clicking save should remove the name of the drop down because im done with the person"
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
  const updated = memoryRecordsCache.filter((r) => r.id !== recordId);
  await persistRecords(updated);
}

// Reset database - clears all stored records completely
export async function resetDatabase(): Promise<ScreeningRecord[]> {
  await persistRecords([]);
  return [];
}

