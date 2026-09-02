import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TrainingRecord, AppDropdownSettings } from '../types';
import { INITIAL_TRAININGS, DEFAULT_DROPDOWN_SETTINGS } from '../data/initialTrainings';

const COLLECTION_NAME = 'trainings';
const SETTINGS_DOC = 'app_dropdown_settings';
const LOCAL_STORAGE_KEY = 'tipsoi_trainings_cache_v2';
const SETTINGS_STORAGE_KEY = 'tipsoi_dropdown_settings_v1';
const SEEDED_FLAG_KEY = 'tipsoi_firestore_seeded_v2';

export const GOOGLE_MEET_INSTANT_NEW = 'https://meet.google.com/new';

export const getCachedTrainings = (): TrainingRecord[] => {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
};

export const getCachedDropdownSettings = (): AppDropdownSettings => {
  try {
    const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // ignore
  }
  return DEFAULT_DROPDOWN_SETTINGS;
};

const withTimeout = <T>(promise: Promise<T>, ms: number = 2500): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms))
  ]);
};

export const fetchDropdownSettings = async (): Promise<AppDropdownSettings> => {
  try {
    const snap = await withTimeout(getDocs(collection(db, 'settings')), 2500);
    const found = snap.docs.find(d => d.id === SETTINGS_DOC);
    if (found && found.exists()) {
      const data = found.data() as AppDropdownSettings;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Settings load notice, using local cache:', err);
  }

  return getCachedDropdownSettings();
};

export const saveDropdownSettings = async (settings: AppDropdownSettings): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC);
    await setDoc(docRef, settings);
  } catch (err) {
    console.warn('Firestore settings write failed, saving locally:', err);
  }
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const resetDropdownSettings = async (): Promise<AppDropdownSettings> => {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC);
    await setDoc(docRef, DEFAULT_DROPDOWN_SETTINGS);
  } catch (err) {
    console.warn('Firestore reset failed:', err);
  }
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_DROPDOWN_SETTINGS));
  return DEFAULT_DROPDOWN_SETTINGS;
};

/**
 * Generates an authentic Google Meet URL with standard 3-4-3 format
 * e.g. https://meet.google.com/wxy-zabc-def
 */
export const generateRandomMeetCode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const code = `${segment(3)}-${segment(4)}-${segment(3)}`;
  return `https://meet.google.com/${code}`;
};

/**
 * Validates and formats user inputted Google Meet codes or links
 */
export const formatMeetUrl = (input: string): string => {
  const clean = input.trim();
  if (!clean) return generateRandomMeetCode();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.includes('meet.google.com/')) {
    return `https://${clean.replace(/^https?:\/\//, '')}`;
  }
  // If user entered code like "abc-defg-hij" or "abcdefghij"
  const sanitized = clean.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (sanitized.length >= 9) {
    const s1 = sanitized.substring(0, 3);
    const s2 = sanitized.substring(3, 7);
    const s3 = sanitized.substring(7, 10);
    return `https://meet.google.com/${s1}-${s2}-${s3}`;
  }
  return `https://meet.google.com/${clean}`;
};

export const getTemplateMessage = (
  clientName: string,
  trainingDate: string,
  trainingTime: string,
  trainerName: string,
  meetLink: string
): string => {
  return `Dear Client,

We hope you are doing well.

This is to inform you that your Tipsoi HRM training session for ${clientName || '(Client Name)'} has been scheduled successfully. Please find the details below:

Date: ${trainingDate || '(Date)'}
Time: ${trainingTime || '(Time)'}
Trainer: ${trainerName || '(Trainer)'}

Google Meet Link: ${meetLink || '(Meet Link)'}


We kindly request you to join the meeting on time to ensure a smooth training session. If you face any issues accessing the meeting link, please feel free to contact us.

Thank you for your cooperation.

Best regards,
Tipsoi Support Team`;
};

export const deleteAllSystemTrainings = async (): Promise<void> => {
  // 1. Clear local storage
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(SEEDED_FLAG_KEY, 'true');
  localStorage.removeItem('tipsoi_trainings_cache_v1');

  // 2. Delete all documents in Firestore
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const docs = snapshot.docs;
      const chunkSize = 400;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const docSnap of chunk) {
          batch.delete(docSnap.ref);
        }
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Firestore bulk wipe error:', err);
  }
};

export const fetchTrainings = async (): Promise<TrainingRecord[]> => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await withTimeout(getDocs(colRef), 2500);

    if (snapshot.empty) {
      localStorage.setItem(SEEDED_FLAG_KEY, 'true');
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      return [];
    }

    const itemsMap = new Map<string, TrainingRecord>();
    snapshot.forEach(docSnap => {
      if (docSnap.id) {
        itemsMap.set(docSnap.id, {
          id: docSnap.id,
          ...docSnap.data()
        } as TrainingRecord);
      }
    });

    const items = Array.from(itemsMap.values());
    localStorage.setItem(SEEDED_FLAG_KEY, 'true');
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    return items;
  } catch (error) {
    console.warn('Network notice when fetching from Firestore, using local cache:', error);
    return getCachedTrainings();
  }
};

export const saveTraining = async (record: Omit<TrainingRecord, 'id'> & { id?: string }): Promise<TrainingRecord> => {
  const id = record.id || `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newRecord: TrainingRecord = {
    ...record,
    id,
    meetLink: record.meetLink ? formatMeetUrl(record.meetLink) : generateRandomMeetCode(),
    createdAt: record.createdAt || new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString()
  };

  // Update local cache first
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  const list: TrainingRecord[] = cached ? JSON.parse(cached) : [];
  const existingIdx = list.findIndex(item => item.id === id);
  if (existingIdx >= 0) {
    list[existingIdx] = newRecord;
  } else {
    list.unshift(newRecord);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));

  // Sync with Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, newRecord);
  } catch (err) {
    console.warn('Firestore write failed, saved to local cache:', err);
  }

  return newRecord;
};

export const updateTrainingStatus = async (id: string, status: TrainingRecord['status']): Promise<void> => {
  // Update local cache
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    const list: TrainingRecord[] = JSON.parse(cached);
    const target = list.find(item => item.id === id);
    if (target) {
      target.status = status;
      target.updatedAt = new Date().toISOString();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    }
  }

  // Sync with Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Firestore update failed, updated in local cache:', err);
  }
};

export const deleteTrainingRecord = async (id: string): Promise<void> => {
  // Update local cache
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    const list: TrainingRecord[] = JSON.parse(cached);
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }

  // Delete from Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete failed, deleted from local cache:', err);
  }
};

export const deleteMultipleTrainingRecords = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const idSet = new Set(ids);

  // Update local cache immediately
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    const list: TrainingRecord[] = JSON.parse(cached);
    const filtered = list.filter(item => !idSet.has(item.id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }

  // Delete from Firestore in chunks of 400
  try {
    const chunkSize = 400;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const id of chunk) {
        const docRef = doc(db, COLLECTION_NAME, id);
        batch.delete(docRef);
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore batch delete failed:', err);
  }
};

export const resetToInitialSeed = async (): Promise<TrainingRecord[]> => {
  try {
    const batch = writeBatch(db);
    for (const item of INITIAL_TRAININGS) {
      const itemRef = doc(db, COLLECTION_NAME, item.id);
      batch.set(itemRef, item);
    }
    await batch.commit();
  } catch (err) {
    console.warn('Firestore batch reset error:', err);
  }
  localStorage.setItem(SEEDED_FLAG_KEY, 'true');
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_TRAININGS));
  return INITIAL_TRAININGS;
};
