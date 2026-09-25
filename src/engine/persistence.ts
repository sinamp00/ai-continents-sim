/**
 * localStorage persistence: named save slots + autosave.
 */
import type { GameState, SaveSlot } from './types';

const SLOTS_KEY = 'aicc-save-slots';
const AUTOSAVE_KEY = 'aicc-autosave';

function readSlots(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    return raw ? (JSON.parse(raw) as SaveSlot[]) : [];
  } catch {
    return [];
  }
}

function writeSlots(slots: SaveSlot[]) {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots.slice(0, 20)));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

export function listSaves(): SaveSlot[] {
  return readSlots().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveGame(name: string, state: GameState): SaveSlot[] {
  const slots = readSlots();
  const slot: SaveSlot = {
    name: name.trim() || `Save ${new Date().toLocaleString()}`,
    savedAt: Date.now(),
    turn: state.turn,
    year: state.year,
    state,
  };
  const existing = slots.findIndex((s) => s.name === slot.name);
  if (existing >= 0) slots[existing] = slot;
  else slots.push(slot);
  writeSlots(slots);
  return listSaves();
}

export function loadSave(name: string): GameState | null {
  const slot = readSlots().find((s) => s.name === name);
  return slot ? slot.state : null;
}

export function deleteSave(name: string): SaveSlot[] {
  writeSlots(readSlots().filter((s) => s.name !== name));
  return listSaves();
}

export function autosave(state: GameState) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadAutosave(): GameState | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function clearAutosave() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    /* ignore */
  }
}
