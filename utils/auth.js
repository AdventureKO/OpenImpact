import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// New multi-user keys
const USERS_KEY = 'auth_users'; // stores a map: { [email]: { user, hash, salt } }
const SESSION_KEY = 'auth_session';

// Legacy single-user keys (migrated if present)
const LEGACY_USER_KEY = 'auth_user';
const LEGACY_HASH_KEY = 'auth_hash';
const LEGACY_SALT_KEY = 'auth_salt';

const ROLE_ORGANIZATION = 'organization';
const ROLE_CONTRIBUTOR = 'contributor';

/** Normalize persisted user shape (existing accounts may lack role). */
export function normalizeUser(user) {
  if (!user) return null;
  let role = user.role;
  if (role !== ROLE_ORGANIZATION && role !== ROLE_CONTRIBUTOR) role = ROLE_CONTRIBUTOR;
  return { ...user, role };
}

async function generateSalt() {
  try {
    const bytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // fall through to other fallbacks
  }
  // Try web crypto if present
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const arr = new Uint8Array(16);
    globalThis.crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Last-resort: non-cryptographic fallback (not ideal for high-security needs)
  const arr = new Array(16).fill(0).map(() => Math.floor(Math.random() * 256));
  return arr.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const toHash = `${salt}:${password}`;
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, toHash);
  return digest;
}
async function migrateLegacyIfNeeded() {
  try {
    const legacyRaw = await SecureStore.getItemAsync(LEGACY_USER_KEY);
    const legacyHash = await SecureStore.getItemAsync(LEGACY_HASH_KEY);
    const legacySalt = await SecureStore.getItemAsync(LEGACY_SALT_KEY);
    if (legacyRaw) {
      // read existing users map, or create new
      const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      const user = JSON.parse(legacyRaw);
      // migrate into users map keyed by email
      users[user.email] = users[user.email] || { user: user, hash: legacyHash || '', salt: legacySalt || '' };
      await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
      // remove legacy keys
      await SecureStore.deleteItemAsync(LEGACY_USER_KEY);
      if (legacyHash) await SecureStore.deleteItemAsync(LEGACY_HASH_KEY);
      if (legacySalt) await SecureStore.deleteItemAsync(LEGACY_SALT_KEY);
    }
  } catch (e) {
    console.warn('auth migration failed', e);
  }
}

export async function registerUser({ email, password, name, isAdmin = false, role: roleIn }) {
  if (!email || !password) throw new Error('Email and password required');
  // basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new Error('Invalid email address');
  // password length policy
  if ((password || '').length < 10) throw new Error('Password must be at least 10 characters');
  await migrateLegacyIfNeeded();
  const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
  const users = usersRaw ? JSON.parse(usersRaw) : {};
  if (users[email]) throw new Error('User already exists');
  // ensure no duplicate username (case-insensitive)
  const desiredName = (name || '').trim().toLowerCase();
  if (desiredName) {
    for (const k of Object.keys(users)) {
      const u = users[k] && users[k].user;
      if (u && (u.name || '').trim().toLowerCase() === desiredName) {
        throw new Error('Username already taken');
      }
    }
  }
  const salt = await generateSalt();
  const hash = await hashPassword(password, salt);
  const role = roleIn === ROLE_ORGANIZATION ? ROLE_ORGANIZATION : ROLE_CONTRIBUTOR;
  const userObj = normalizeUser({ email, name: name || '', createdAt: Date.now(), isAdmin: !!isAdmin, role });
  users[email] = { user: userObj, hash, salt };
  await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
  try {
    // create a session for the newly registered user so they're logged in immediately
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ email: userObj.email, ts: Date.now() }));
  } catch (e) {
    console.warn('registerUser: could not set session', e);
  }
  console.log('registerUser: registered', email, role);
  return userObj;
}

export async function ensureAdminExists() {
  try {
    await migrateLegacyIfNeeded();
    const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    const adminEmail = 'admin@impacttrack.local';
    if (users[adminEmail]) return users[adminEmail].user;
    // create a default admin with a safe temporary password
    const defaultPassword = 'ImpactTrackAdmin123!';
    const salt = await generateSalt();
    const hash = await hashPassword(defaultPassword, salt);
    const userObj = normalizeUser({ email: adminEmail, name: 'Admin', createdAt: Date.now(), isAdmin: true, role: ROLE_CONTRIBUTOR });
    users[adminEmail] = { user: userObj, hash, salt };
    await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
    console.log('ensureAdminExists: created admin user', adminEmail);
    return userObj;
  } catch (e) {
    console.warn('ensureAdminExists failed', e);
    return null;
  }
}

export async function loginUser(email, password) {
  if (!email || !password) throw new Error('Email and password required');
  await migrateLegacyIfNeeded();
  const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
  if (!usersRaw) throw new Error('No user registered');
  const users = JSON.parse(usersRaw);
  const entry = users[email];
  if (!entry) throw new Error('Invalid credentials');
  const salt = entry.salt || '';
  const expected = entry.hash || '';
  const hash = await hashPassword(password, salt);
  if (hash !== expected) throw new Error('Invalid credentials');
  // set a small session token in secure store
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ email: entry.user.email, ts: Date.now() }));
  return normalizeUser(entry.user);
}

export async function logoutUser() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function getCurrentUser() {
  await migrateLegacyIfNeeded();
  const session = await SecureStore.getItemAsync(SESSION_KEY);
  if (!session) return null;
  try {
    const s = JSON.parse(session);
    const email = s && s.email;
    if (!email) return null;
    const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
    if (!usersRaw) return null;
    const users = JSON.parse(usersRaw);
    const entry = users[email];
    return entry ? normalizeUser(entry.user) : null;
  } catch (e) {
    return null;
  }
}

// initiate a password reset: returns a reset token (app should email this in production)
export async function initiatePasswordReset(email) {
  if (!email) throw new Error('Email required');
  await migrateLegacyIfNeeded();
  const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
  if (!usersRaw) throw new Error('No user registered');
  const users = JSON.parse(usersRaw);
  const entry = users[email];
  if (!entry) throw new Error('User not found');
  const token = await generateSalt();
  const expires = Date.now() + (1000 * 60 * 60); // 1 hour
  entry.resetToken = token;
  entry.resetExpires = expires;
  users[email] = entry;
  await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
  return token;
}

export async function resetPassword(email, token, newPassword) {
  if (!email || !token || !newPassword) throw new Error('Email, token and new password required');
  if ((newPassword || '').length < 10) throw new Error('Password must be at least 10 characters');
  await migrateLegacyIfNeeded();
  const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
  if (!usersRaw) throw new Error('No user registered');
  const users = JSON.parse(usersRaw);
  const entry = users[email];
  if (!entry) throw new Error('User not found');
  if (!entry.resetToken || entry.resetToken !== token) throw new Error('Invalid reset token');
  if (!entry.resetExpires || Date.now() > entry.resetExpires) throw new Error('Reset token expired');
  // apply new password
  const salt = await generateSalt();
  const hash = await hashPassword(newPassword, salt);
  entry.salt = salt;
  entry.hash = hash;
  delete entry.resetToken;
  delete entry.resetExpires;
  users[email] = entry;
  await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
  return true;
}

// Simple 2FA helpers (code-based). These helpers are intentionally separate from login flow
// so apps can opt-in and email/SMS the code in production. For demo, generateTwoFactorCode returns the code.
export async function enableTwoFactor(email, enabled = true) {
  if (!email) throw new Error('Email required');
  await migrateLegacyIfNeeded();
  const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
  const users = usersRaw ? JSON.parse(usersRaw) : {};
  const entry = users[email];
  if (!entry) throw new Error('User not found');
  entry.user.twoFactorEnabled = !!enabled;
  users[email] = entry;
  await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
  return entry.user;
}

export async function generateTwoFactorCode(email) {
  if (!email) throw new Error('Email required');
  await migrateLegacyIfNeeded();
  const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
  if (!usersRaw) throw new Error('No user registered');
  const users = JSON.parse(usersRaw);
  const entry = users[email];
  if (!entry) throw new Error('User not found');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + (5 * 60 * 1000); // 5 minutes
  entry.twoFactorCode = code;
  entry.twoFactorExpires = expires;
  users[email] = entry;
  await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
  return code; // in production send via email/SMS instead
}

export async function verifyTwoFactorCode(email, code) {
  if (!email || !code) throw new Error('Email and code required');
  await migrateLegacyIfNeeded();
  const usersRaw = await SecureStore.getItemAsync(USERS_KEY);
  if (!usersRaw) throw new Error('No user registered');
  const users = JSON.parse(usersRaw);
  const entry = users[email];
  if (!entry) throw new Error('User not found');
  if (!entry.twoFactorCode || entry.twoFactorCode !== String(code)) throw new Error('Invalid 2FA code');
  if (!entry.twoFactorExpires || Date.now() > entry.twoFactorExpires) throw new Error('2FA code expired');
  // consume
  delete entry.twoFactorCode;
  delete entry.twoFactorExpires;
  users[email] = entry;
  await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
  return true;
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  normalizeUser,
  initiatePasswordReset,
  resetPassword,
  enableTwoFactor,
  generateTwoFactorCode,
  verifyTwoFactorCode,
};
