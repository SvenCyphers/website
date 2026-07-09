import { json } from './http.js';

const encoder = new TextEncoder();

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
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a[index] ^ b[index];
  }
  return result === 0;
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

  const [encodedPayload, signature] = token.split('.');
  const expected = await hmac(secret, encodedPayload);
  const actual = base64UrlToBytes(signature || '');

  if (!timingSafeEqual(expected, actual)) {
    return false;
  }

  try {
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

export function validateAdminPassword(env, password) {
  return Boolean(env.ADMIN_PASSWORD) && password === env.ADMIN_PASSWORD;
}

