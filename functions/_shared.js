// Shared helpers for Pages Functions: JWT (HMAC-SHA256), cookies, sessions, D1 mapping.
// Files starting with "_" are not routed but can be imported by route handlers.

const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(b64) {
  b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
const b64urlEncodeStr = (s) => bytesToB64url(enc.encode(s));
const b64urlDecodeStr = (s) => dec.decode(b64urlToBytes(s));

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

// Sign our own session token (a small JWT) with the SESSION_SECRET.
export async function signJWT(payload, secret, expSeconds = 60 * 60 * 24 * 30) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + expSeconds };
  const data = `${b64urlEncodeStr(JSON.stringify(header))}.${b64urlEncodeStr(JSON.stringify(body))}`;
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
  return `${data}.${bytesToB64url(sig)}`;
}

export async function verifyJWT(token, secret) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const key = await hmacKey(secret);
  let ok = false;
  try { ok = await crypto.subtle.verify('HMAC', key, b64urlToBytes(parts[2]), enc.encode(data)); } catch (e) { return null; }
  if (!ok) return null;
  let payload;
  try { payload = JSON.parse(b64urlDecodeStr(parts[1])); } catch (e) { return null; }
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// Decode (without verifying) a JWT payload. Used only on Google's id_token,
// which we fetch directly from Google's token endpoint over TLS in the callback.
export function decodeJwtPayload(idToken) {
  const parts = (idToken || '').split('.');
  if (parts.length < 2) return null;
  try { return JSON.parse(b64urlDecodeStr(parts[1])); } catch (e) { return null; }
}

export function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  header.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export function cookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push('HttpOnly');
  parts.push('Secure');
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  return parts.join('; ');
}

export async function getSessionUser(context) {
  const cookies = parseCookies(context.request);
  return await verifyJWT(cookies['session'], context.env.SESSION_SECRET);
}

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

// --- group <-> D1 row mapping ---
export function rowToGroup(r) {
  return {
    id: r.id,
    title: r.title,
    names: safeParse(r.names, []),
    mode: r.mode,
    size: r.size,
    avoidRepeat: !!r.avoid_repeat,
    keepApart: safeParse(r.keep_apart, []),
    result: r.result ? safeParse(r.result, null) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
export function normalizeGroup(b) {
  b = b || {};
  return {
    title: String(b.title || 'Untitled group').slice(0, 200),
    names: Array.isArray(b.names) ? b.names.map((n) => String(n)).slice(0, 1000) : [],
    mode: b.mode === 'size' ? 'size' : 'groups',
    size: Math.max(1, Math.min(200, parseInt(b.size) || 5)),
    avoidRepeat: !!b.avoidRepeat,
    keepApart: Array.isArray(b.keepApart) ? b.keepApart : [],
    result: b.result || null,
  };
}
function safeParse(s, fallback) { try { return JSON.parse(s); } catch (e) { return fallback; } }
