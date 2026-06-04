// GET  /api/groups  → list the signed-in user's saved groups
// POST /api/groups  → create a new saved group
import { getSessionUser, json, rowToGroup, normalizeGroup } from '../../_shared.js';

export async function onRequestGet(context) {
  const user = await getSessionUser(context);
  if (!user) return json({ error: 'unauthorized' }, { status: 401 });

  const { results } = await context.env.DB.prepare(
    'SELECT * FROM groups WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(user.sub).all();

  return json({ groups: (results || []).map(rowToGroup) });
}

export async function onRequestPost(context) {
  const user = await getSessionUser(context);
  if (!user) return json({ error: 'unauthorized' }, { status: 401 });

  let body;
  try { body = await context.request.json(); } catch (e) { body = {}; }
  const g = normalizeGroup(body);
  const id = crypto.randomUUID();
  const now = Date.now();

  await context.env.DB.prepare(
    `INSERT INTO groups (id, user_id, title, names, mode, size, avoid_repeat, keep_apart, result, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, user.sub, g.title, JSON.stringify(g.names), g.mode, g.size,
    g.avoidRepeat ? 1 : 0, JSON.stringify(g.keepApart), g.result ? JSON.stringify(g.result) : null, now, now
  ).run();

  return json({ group: { id, ...g, createdAt: now, updatedAt: now } });
}
