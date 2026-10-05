const SAVED_KEY = "ruaingga-saved";
const REQUESTS_KEY = "ruaingga-requests";

let savedCache: string[] = [];
let savedRaw = "";
let requestCache: PhraseRequest[] = [];
let requestRaw = "";

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function loadSavedIds(): string[] {
  const raw = readRaw(SAVED_KEY) ?? "[]";
  if (raw === savedRaw) return savedCache;
  savedRaw = raw;
  try {
    savedCache = JSON.parse(raw) as string[];
  } catch {
    savedCache = [];
  }
  return savedCache;
}

export function saveIds(ids: string[]): void {
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("ruaingga-local"));
}

export function toggleSaved(id: string): string[] {
  const current = loadSavedIds();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
  saveIds(next);
  return next;
}

export type PhraseRequest = {
  id: string;
  english: string;
  createdAt: string;
};

export function loadRequests(): PhraseRequest[] {
  const raw = readRaw(REQUESTS_KEY) ?? "[]";
  if (raw === requestRaw) return requestCache;
  requestRaw = raw;
  try {
    requestCache = JSON.parse(raw) as PhraseRequest[];
  } catch {
    requestCache = [];
  }
  return requestCache;
}

export function addRequest(english: string): PhraseRequest[] {
  const next = [
    { id: crypto.randomUUID(), english: english.trim(), createdAt: new Date().toISOString() },
    ...loadRequests(),
  ].slice(0, 40);
  window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("ruaingga-local"));
  return next;
}
