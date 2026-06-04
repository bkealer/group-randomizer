// POST /api/auth/logout → clear the session cookie.
import { cookie } from '../../_shared.js';

export async function onRequestPost() {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', cookie('session', '', { maxAge: 0 }));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
