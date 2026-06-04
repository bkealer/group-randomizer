# Group Randomizer

A clean, classroom-friendly tool for splitting a list of students into random groups —
with a fun "shuffle → gather → confetti → reveal" animation, teacher-only keep-apart rules,
and per-account saved lists.

Built on **Cloudflare Pages + Functions + D1**, with **Google sign-in** (any Google account).

## Features
- Paste names (one per line); split by **number of groups** or **students per group**.
- Animated reveal: 12 shuffle routines (incl. hidden 😀 / ❤️ shape reveals), a confetti burst,
  then names sprinkle into the group cards.
- **Drag a student** between groups after the roll.
- **Keep-apart rules** (teacher-only, per list) so certain students never share a group.
- **Avoid repeat groupings** toggle.
- Save / load / delete named groups, **print**, and custom **shuffle phrases**.
- Everything **auto-saves** to your account and syncs across devices.

## Stack
- `public/index.html` — the whole frontend (HTML/CSS/JS, no build step).
- `functions/api/**` — Pages Functions: Google OAuth + groups/settings CRUD.
- `functions/_shared.js` — JWT/session/cookie helpers + D1 row mapping.
- `schema.sql` — D1 (SQLite) schema. `wrangler.toml` — config + D1 binding.

## Setup / deploy
See **[SETUP.md](./SETUP.md)** for the full, ordered checklist (GitHub → Cloudflare Pages →
D1 → Google OAuth → secrets).

## Routes
| Method | Path                     | Purpose                          |
|--------|--------------------------|----------------------------------|
| GET    | `/api/auth/login`        | Redirect to Google consent       |
| GET    | `/api/auth/callback`     | OAuth callback → set session      |
| POST   | `/api/auth/logout`       | Clear session                     |
| GET    | `/api/me`                | Current user + saved phrases      |
| GET    | `/api/groups`            | List your saved groups            |
| POST   | `/api/groups`            | Create a group                    |
| PUT    | `/api/groups/:id`        | Update a group (owner only)       |
| DELETE | `/api/groups/:id`        | Delete a group (owner only)       |
| PUT    | `/api/settings/phrases`  | Save your shuffle phrases         |

The `mockups/` folder keeps the original design explorations.
