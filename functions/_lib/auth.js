import { json } from './http.js';

const encoder = new TextEncoder();
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_ATTEMPTS = 10;

function bytesToBase64Url(bytes) {
  var binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return new Uint8Array(signature);
}

function timingSafeEqual(a, b) {
  const length = Math.max(a.length, b.length);
  let result = 0;
  for (let index = 0; index < length; index += 1) {
    result |= (a[index] || 0) ^ (b[index] || 0);
  }
  return result === 0 && a.length === b.length;
}

async function sha256(value) {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(hash));
}

async function requestFingerprint(request) {
  const ip = request.headers.get('cf-connecting-ip') || '';
  const userAgent = request.headers.get('user-agent') || '';
  return sha256([ip, userAgent].join('|'));
}

async function ensureLoginAttemptsTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS admin_login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fingerprint TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_fingerprint_created
     ON admin_login_attempts (fingerprint, created_at DESC)`
  ).run();
}

export function getBearerToken(request) {
  const header = request.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) {
    return '';
  }
  return header.slice(7).trim();
}

export async function createToken(env) {
  const secret = env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET ontbreekt.');
  }

  const payload = {
    sub: 'admin',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
  };
  const encodedPayload = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = bytesToBase64Url(await hmac(secret, encodedPayload));
  return `${encodedPayload}.${signature}`;
}

export async function verifyToken(env, token) {
  const secret = env.AUTH_SECRET;
  if (!secret || !token || !token.includes('.')) {
    return false;
  }

  try {
    const [encodedPayload, signature] = token.split('.');
    const expected = await hmac(secret, encodedPayload);
    const actual = base64UrlToBytes(signature || '');

    if (!timingSafeEqual(expected, actual)) {
      return false;
    }

    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload)));
    return payload.sub === 'admin' && payload.exp > Math.floor(Date.now() / 1000);
  } catch (error) {
    return false;
  }
}

export async function requireAdmin(context) {
  const ok = await verifyToken(context.env, getBearerToken(context.request));
  if (!ok) {
    return json({ ok: false, error: 'Niet ingelogd.' }, 401);
  }
  return null;
}

export async function assertLoginAllowed(context) {
  const db = context.env.DB;
  if (!db) {
    return null;
  }

  await ensureLoginAttemptsTable(db);
  const fingerprint = await requestFingerprint(context.request);
  const since = Math.floor(Date.now() / 1000) - LOGIN_WINDOW_SECONDS;
  const row = await db.prepare(
    `SELECT COUNT(*) AS count
     FROM admin_login_attempts
     WHERE fingerprint = ? AND success = 0 AND created_at >= ?`
  ).bind(fingerprint, since).first();

  if (Number(row?.count || 0) >= LOGIN_MAX_ATTEMPTS) {
    return json({ ok: false, error: 'Te veel mislukte pogingen. Probeer het later opnieuw.' }, 429);
  }

  return null;
}

export async function recordLoginAttempt(context, success) {
  const db = context.env.DB;
  if (!db) {
    return;
  }

  await ensureLoginAttemptsTable(db);
  const fingerprint = await requestFingerprint(context.request);
  const now = Math.floor(Date.now() / 1000);
  const oldest = now - LOGIN_WINDOW_SECONDS * 2;
  await db.prepare('DELETE FROM admin_login_attempts WHERE created_at < ?').bind(oldest).run();
  await db.prepare(
    `INSERT INTO admin_login_attempts (fingerprint, success, created_at)
     VALUES (?, ?, ?)`
  ).bind(fingerprint, success ? 1 : 0, now).run();
}

export function validateAdminPassword(env, password) {
  const expected = encoder.encode(String(env.ADMIN_PASSWORD || ''));
  const actual = encoder.encode(String(password || ''));
  return Boolean(env.ADMIN_PASSWORD) && timingSafeEqual(expected, actual);
}
