import * as storage from '../utils/storage';

const KEY = 'appTheme';
let current = null;
const listeners = new Set();

export async function init() {
  if (current !== null) return current;
  current = await storage.load(KEY, null);
  return current;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function setTheme(pref) {
  try {
    await storage.save(KEY, pref);
    current = pref;
    listeners.forEach(fn => { try { fn(pref); } catch (e) {} });
    return true;
  } catch (e) { return false; }
}

export async function getTheme() {
  if (current === null) {
    current = await storage.load(KEY, null);
  }
  return current;
}

export default { init, subscribe, setTheme, getTheme };

