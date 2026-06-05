// PUT /api/settings/sound → save this user's chosen shuffle sound.
import { getSessionUser, json } from '../../_shared.js';

const ALLOWED = ['off', 'whoosh', 'arcade', 'drumroll', 'rising', 'casino'];

export async function onRequestPut(context) {
  const user = await getSessionUser(context);
  if (!user) return json({ error: 'unauthorized' }, { status: 401 });

  let body;
  try { body = await context.request.json(); } catch (e) { body = {}; }
  const sound = ALLOWED.includes(body.sound) ? body.sound : 'off';

  await context.env.DB.prepare('UPDATE users SET sound = ? WHERE id = ?')
    .bind(sound, user.sub).run();

  return json({ ok: true, sound });
}
