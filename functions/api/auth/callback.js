// GET /api/auth/callback → exchange the code, verify, upsert user, set session cookie.
import { parseCookies, cookie, decodeJwtPayload, signJWT } from '../../_shared.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request);

  if (!code || !state || state !== cookies['oauth_state']) {
    return new Response('Invalid sign-in state. Please try again.', { status: 400 });
  }

  const redirectUri = `${url.origin}/api/auth/callback`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) return new Response('Could not complete sign-in (token exchange failed).', { status: 502 });

  const tokens = await tokenRes.json();
  const claims = decodeJwtPayload(tokens.id_token);
  if (!claims || !claims.sub || !claims.email) {
    return new Response('Could not read your Google account info.', { status: 502 });
  }

  // Optional allow-list: set ALLOWED_EMAILS (comma-separated) to restrict who can sign in.
  if (env.ALLOWED_EMAILS) {
    const allowed = env.ALLOWED_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (allowed.length && !allowed.includes(String(claims.email).toLowerCase())) {
      return new Response('This account is not allowed to use this app.', { status: 403 });
    }
  }

  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, picture, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture`
  ).bind(claims.sub, claims.email, claims.name || null, claims.picture || null, now).run();

  const session = await signJWT(
    { sub: claims.sub, email: claims.email, name: claims.name || '', picture: claims.picture || '' },
    env.SESSION_SECRET
  );

  const headers = new Headers({ Location: '/' });
  headers.append('Set-Cookie', cookie('session', session, { maxAge: 60 * 60 * 24 * 30 }));
  headers.append('Set-Cookie', cookie('oauth_state', '', { maxAge: 0 }));
  return new Response(null, { status: 302, headers });
}
