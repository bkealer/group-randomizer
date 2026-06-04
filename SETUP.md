# Group Randomizer — Setup & Deploy

This app runs on **Cloudflare Pages** (static site + Functions API) with a **D1** database
and **Google sign-in**. Below is the one-time setup, in order. Steps marked **[you]** need
your accounts; the rest is already built.

The pieces:
- Frontend: `public/index.html`
- API: `functions/api/**` (Pages Functions)
- Database schema: `schema.sql`
- Config: `wrangler.toml`

---

## 1. Put the code on GitHub  **[you]**

1. Create a new **empty** repo at https://github.com/new — name it `group-randomizer`
   (no README/.gitignore; we already have them).
2. Back here, push the code (I can run these for you once the repo exists):
   ```bash
   git remote add origin https://github.com/<your-username>/group-randomizer.git
   git branch -M main
   git push -u origin main
   ```
   The first push opens a browser to authorize Git on Windows.

---

## 2. Create the Cloudflare Pages project  **[you]**

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick the `group-randomizer` repo.
2. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `public`
3. Click **Save and Deploy**. The first build publishes the static site (sign-in won't work
   yet). Note your URL, e.g. `https://group-randomizer.pages.dev`.

---

## 3. Create the D1 database  **[you + me]**

Easiest from your machine after a one-time login:
```bash
wrangler login                 # opens browser, authorize
npm run db:create              # creates "group-randomizer-db", prints a database_id
```
Then:
- Paste the printed `database_id` into **`wrangler.toml`** (replace `REPLACE_WITH_YOUR_D1_DATABASE_ID`), commit & push.
- Create the tables in the live DB:
  ```bash
  npm run db:init              # runs schema.sql against the remote D1
  ```

Bind it to Pages: dashboard → your Pages project → **Settings → Functions → D1 database
bindings** → **Add** → Variable name **`DB`** → select `group-randomizer-db`.
(If `wrangler.toml` has the binding, Cloudflare may pick it up automatically — but setting it
in the dashboard is the reliable path for Git-connected projects.)

---

## 4. Create the Google OAuth client  **[you]**

1. https://console.cloud.google.com → create/select a project (e.g. "Group Randomizer").
2. **APIs & Services → OAuth consent screen**:
   - User type: **External** → Create.
   - App name, your support email, developer email. Save.
   - **Publishing status:** click **Publish app** (so *any* Google account can sign in,
     not just test users).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins:** `https://group-randomizer.pages.dev`
   - **Authorized redirect URIs:** `https://group-randomizer.pages.dev/api/auth/callback`
     *(use your real URL from step 2; add more later for a custom domain).*
   - Create → copy the **Client ID** and **Client secret**.

---

## 5. Set the secrets in Cloudflare  **[you]**

Dashboard → Pages project → **Settings → Environment variables** → **Production** → add
(mark each as **Secret / Encrypt**):

| Name                   | Value                                            |
|------------------------|--------------------------------------------------|
| `GOOGLE_CLIENT_ID`     | from step 4                                       |
| `GOOGLE_CLIENT_SECRET` | from step 4                                       |
| `SESSION_SECRET`       | a long random string (see below)                  |
| `ALLOWED_EMAILS`       | *(optional)* comma-separated allow-list of emails |

Generate `SESSION_SECRET` (PowerShell):
```powershell
[Convert]::ToBase64String((1..48 | % {Get-Random -Max 256}))
```

Then **redeploy** (dashboard → Deployments → Retry deployment, or push any commit).

---

## 6. Done — try it

Visit your URL → **Sign in with Google** → create lists, randomize, save. Each Google
account sees only its own saved groups.

---

## Local development (optional)
```bash
cp .dev.vars.example .dev.vars      # fill in your Google client id/secret + SESSION_SECRET
npm install
npm run db:init:local               # seed a local D1
npm run dev                         # http://localhost:8788
```
For local sign-in to work, also add `http://localhost:8788/api/auth/callback` as an
Authorized redirect URI in your Google OAuth client.

---

## How saving works
- A list is created the first time you **Randomize** it or add a **keep-apart condition**.
- After that, every change (roster, title, settings, conditions, re-rolls) **auto-saves** to
  the server — the **Save** button is just reassurance.
- **New group** starts a clean list; **Clear groups** wipes the result but keeps the roster.
