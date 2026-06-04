// GET /api/auth/login → redirect the user to Google's consent screen.
import { cookie } from '../../_shared.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/callback`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  const headers = new Headers({ Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  // short-lived CSRF state cookie, checked in the callback
  headers.append('Set-Cookie', cookie('oauth_state', state, { maxAge: 600 }));
  return new Response(null, { status: 302, headers });
}
