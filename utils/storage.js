import AsyncStorage from '@react-native-async-storage/async-storage';

// Aliases map: newKey -> [legacyKey1, legacyKey2]
const KEY_ALIASES = {
  myFundraisers: ['myProjects'],
  publicFundraisers: ['publicProjects'],
  lastPickedFundraiserImage: ['lastPickedProjectImage'],
  charityjwt: ['projectediajwt']
};

async function rawGet(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn('AsyncStorage rawGet error', e);
    return null;
  }
}

async function tryParse(s, defaultValue) {
  if (s == null) return defaultValue;
  try { return JSON.parse(s); } catch (e) { return defaultValue; }
}

export async function save(key, value) {
  try {
    const s = JSON.stringify(value);
    await AsyncStorage.setItem(key, s);
    return true;
  } catch (err) {
    console.warn('AsyncStorage save error', err);
    return false;
  }
}

export async function load(key, defaultValue = null) {
  try {
    // try primary key
    const s = await rawGet(key);
    if (s != null) return tryParse(s, defaultValue);
    // try aliases (legacy)
    const aliases = KEY_ALIASES[key] || [];
    for (const a of aliases) {
      const sa = await rawGet(a);
      if (sa != null) return tryParse(sa, defaultValue);
    }
    return defaultValue;
  } catch (err) {
    console.warn('AsyncStorage load error', err);
    return defaultValue;
  }
}

export async function remove(key) {
  try {
    await AsyncStorage.removeItem(key);
    const aliases = KEY_ALIASES[key] || [];
    for (const a of aliases) await AsyncStorage.removeItem(a);
    return true;
  } catch (err) {
    console.warn('AsyncStorage remove error', err);
    return false;
  }
}

function userKey(user, key) {
  if (!user) return key;
  const id = (user.email || user.id || user.name || 'user').toString();
  const safe = id.replace(/[^a-zA-Z0-9@._-]/g, '_');
  return `user:${safe}:${key}`;
}

export async function saveForUser(user, key, value) {
  return save(userKey(user, key), value);
}

export async function loadForUser(user, key, defaultValue = null) {
  // try primary user key
  try {
    const primary = await rawGet(userKey(user, key));
    if (primary != null) return tryParse(primary, defaultValue);
    // try legacy aliases
    const aliases = KEY_ALIASES[key] || [];
    for (const a of aliases) {
      const got = await rawGet(userKey(user, a));
      if (got != null) return tryParse(got, defaultValue);
    }
    return defaultValue;
  } catch (e) {
    console.warn('AsyncStorage loadForUser error', e);
    return defaultValue;
  }
}

export async function removeForUser(user, key) {
  try {
    await remove(userKey(user, key));
    const aliases = KEY_ALIASES[key] || [];
    for (const a of aliases) await remove(userKey(user, a));
    return true;
  } catch (err) {
    console.warn('AsyncStorage removeForUser error', err);
    return false;
  }
}
