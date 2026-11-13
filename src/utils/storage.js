import { initialState } from '../logic/coliseo.js';

const KEY = 'coliseo30_state_v1';
let mem = null; // respaldo en memoria si localStorage no está disponible

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1 && Array.isArray(s.picks)) return s;
    }
  } catch (e) { /* almacenamiento bloqueado o dato corrupto */ }
  return mem || initialState();
}

export function saveState(state) {
  mem = state;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignorar */ }
}
