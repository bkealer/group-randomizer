// GET /api/me → the current signed-in user (or { user: null }) plus saved phrases.
import { getSessionUser, json } from '../_shared.js';

export async function onRequestGet(context) {
  const user = await getSessionUser(context);
  if (!user) return json({ user: null });

  let phrases = null, sound = null;
  try {
    const row = await context.env.DB.prepare('SELECT phrases, sound FROM users WHERE id = ?').bind(user.sub).first();
    if (row && row.phrases) phrases = JSON.parse(row.phrases);
    if (row && row.sound) sound = row.sound;
  } catch (e) { /* ignore */ }

  return json({
    user: { id: user.sub, email: user.email, name: user.name, picture: user.picture },
    phrases,
    sound,
  });
}
