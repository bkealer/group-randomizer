// PUT /api/settings/phrases → save this user's custom shuffle phrases.
import { getSessionUser, json } from '../../_shared.js';

export async function onRequestPut(context) {
  const user = await getSessionUser(context);
  if (!user) return json({ error: 'unauthorized' }, { status: 401 });

  let body;
  try { body = await context.request.json(); } catch (e) { body = {}; }
  const phrases = Array.isArray(body.phrases)
    ? body.phrases.map((p) => String(p).slice(0, 200)).slice(0, 100)
    : [];

  await context.env.DB.prepare('UPDATE users SET phrases = ? WHERE id = ?')
    .bind(JSON.stringify(phrases), user.sub).run();

  return json({ ok: true });
}
