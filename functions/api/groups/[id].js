// PUT    /api/groups/:id  → update a saved group (only your own)
// DELETE /api/groups/:id  → delete a saved group (only your own)
import { getSessionUser, json, normalizeGroup } from '../../_shared.js';

export async function onRequestPut(context) {
  const user = await getSessionUser(context);
  if (!user) return json({ error: 'unauthorized' }, { status: 401 });

  const id = context.params.id;
  let body;
  try { body = await context.request.json(); } catch (e) { body = {}; }
  const g = normalizeGroup(body);
  const now = Date.now();

  const res = await context.env.DB.prepare(
    `UPDATE groups SET title = ?, names = ?, mode = ?, size = ?, avoid_repeat = ?, keep_apart = ?, result = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).bind(
    g.title, JSON.stringify(g.names), g.mode, g.size, g.avoidRepeat ? 1 : 0,
    JSON.stringify(g.keepApart), g.result ? JSON.stringify(g.result) : null, now, id, user.sub
  ).run();

  if (!res.meta || res.meta.changes === 0) return json({ error: 'not found' }, { status: 404 });
  return json({ group: { id, ...g, updatedAt: now } });
}

export async function onRequestDelete(context) {
  const user = await getSessionUser(context);
  if (!user) return json({ error: 'unauthorized' }, { status: 401 });

  const id = context.params.id;
  const res = await context.env.DB.prepare('DELETE FROM groups WHERE id = ? AND user_id = ?')
    .bind(id, user.sub).run();

  if (!res.meta || res.meta.changes === 0) return json({ error: 'not found' }, { status: 404 });
  return json({ ok: true });
}
