import { useEffect, useSyncExternalStore } from "react";
import { journalSchema, type ClinicalCase, type Journal, type LearningReview } from "@/lib/dessert-journal";

const KEY = "dessert-clinical-journal-v1";
const empty: Journal = { cases: [], reviews: [] };
let journal = empty;
let loaded = false;
let storageError: string | null = null;
const subscribers = new Set<() => void>();
const subscribe = (listener: () => void) => { subscribers.add(listener); return () => { subscribers.delete(listener); }; };
const notify = () => subscribers.forEach((listener) => listener());

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) journal = journalSchema.parse(JSON.parse(raw));
  } catch { storageError = "Saved notes could not be read. Your existing browser data has not been overwritten."; }
  notify();
}
function save(next: Journal) {
  try {
    localStorage.setItem(KEY, JSON.stringify(journalSchema.parse(next)));
    journal = next;
    storageError = null;
    notify();
    return true;
  } catch { storageError = "Could not save in this browser. Check available storage and browser permissions."; notify(); return false; }
}
export function useDessertJournal() {
  const data = useSyncExternalStore(subscribe, () => journal, () => empty);
  const error = useSyncExternalStore(subscribe, () => storageError, () => null);
  useEffect(load, []);
  return {
    ...data, error,
    addCase: (record: ClinicalCase) => save({ ...journal, cases: [record, ...journal.cases] }),
    addReview: (record: LearningReview) => save({ ...journal, reviews: [record, ...journal.reviews] }),
    deleteCase: (id: string) => save({ cases: journal.cases.filter((c) => c.id !== id), reviews: journal.reviews.map((r) => r.caseId === id ? { ...r, caseId: "" } : r) }),
    deleteReview: (id: string) => save({ ...journal, reviews: journal.reviews.filter((r) => r.id !== id) }),
  };
}