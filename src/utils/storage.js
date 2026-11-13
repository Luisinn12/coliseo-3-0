import { initialState, sanitize } from '../logic/coliseo.js';

const KEY = 'coliseo30_state_v1';
let mem = null; // respaldo en memoria si localStorage no está disponible

// Devuelve { state, repaired }. Todo estado restaurado se vuelve a validar jugada por jugada
// (turno, repetidos, límite de MMR y posibilidad de completar el draft).
export function loadState() {
  let raw = null;
  try {
    const txt = localStorage.getItem(KEY);
    if (txt) { const s = JSON.parse(txt); if (s && s.v === 1) raw = s; }
  } catch (e) { /* almacenamiento bloqueado o dato corrupto */ }
  if (!raw && mem) raw = mem;
  if (!raw) return { state: initialState(), repaired: false };
  return sanitize(raw);
}

export function saveState(state) {
  mem = state;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignorar */ }
}
