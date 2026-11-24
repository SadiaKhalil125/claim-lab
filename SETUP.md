# Prior-Art Scout — local setup (AGENT-A-THON)

One guide for your Windows laptop: from an empty `Agent-a-thon` folder to GitHub + Vercel.  
You already have **Node v20**, **npm**, and **Git** — good to go.

**Project idea:** Multi-agent prior-art search (PatentsView, OpenAlex, arXiv) with a critic loop.  
**Folder on your PC:** `C:\Users\s.khalil\Documents\Agent-a-thon`

---

## What you will have when done

| Piece | Purpose |
|--------|---------|
| Next.js app | UI + API routes on Vercel |
| `.env.local` | LiteLLM secrets (never on GitHub) |
| `/api/chat` | First server-side LLM call (hackathon pattern) |
| GitHub repo | Public code for evaluators |
| Vercel URL | Live demo |

---

## Part A — Create the app (no LiteLLM key yet)

### A1. Open terminal in Cursor

`Terminal → New Terminal`

### A2. Go to your hackathon folder

**PowerShell or CMD:**

```powershell
cd C:\Users\s.khalil\Documents\Agent-a-thon
```

### A3. Create Next.js (choose one)

**Option 1 — app lives inside `Agent-a-thon` (folder must be empty):**

```powershell
npx create-next-app@latest .
```

When prompted, accept defaults (**Yes** for App Router, TypeScript, Tailwind, ESLint).

**Option 2 — subfolder (recommended if `Agent-a-thon` has other files):**

```powershell
npx create-next-app@latest prior-art-scout
cd prior-art-scout
```

The rest of this doc assumes your project root is where `package.json` lives (either `Agent-a-thon` or `Agent-a-thon\prior-art-scout`).

### A4. Install OpenAI SDK (works with LiteLLM)

```powershell
npm install openai
```

### A5. Open project in Cursor

`File → Open Folder` → select the folder that contains `package.json`.

### A6. Run locally

```powershell
npm run dev
```

Open **http://localhost:3000** — you should see the default Next.js page.

Stop the server: `Ctrl + C`.

---

## Part B — Secrets and LiteLLM (when you get the key)

### B1. Create `.env.local` in the project root

Copy from `.env.example` or create a new file named exactly `.env.local`:

```env
LITELLM_BASE_URL=https://<gateway-from-organizers>/v1
LITELLM_API_KEY=sk-...
LITELLM_MODEL=claude-sonnet
```

- No quotes around values.
- No spaces around `=`.
- Restart `npm run dev` after every change to `.env.local`.

### B2. Before you have a key (optional placeholder)

```env
LITELLM_BASE_URL=https://placeholder/v1
LITELLM_API_KEY=placeholder
LITELLM_MODEL=claude-sonnet
```

The app can show a friendly “not configured” message until the real key arrives.

### B3. Test the key (when organizers send it)

**Windows CMD or PowerShell — use `curl.exe`:**

```powershell
curl.exe https://<LITELLM_BASE_URL>/models -H "Authorization: Bearer <LITELLM_API_KEY>"
```

You want JSON with model names. **401** = wrong key. **Could not resolve host** = wrong URL.

---

## Part C — Hackathon file pattern (browser never calls LiteLLM)

Add these paths (if you used **create-next-app** with `src/` — default in newer templates):

| File | Role |
|------|------|
| `src/app/api/chat/route.ts` | Server-only LiteLLM call |
| `src/app/page.tsx` | UI that `fetch`es `/api/chat` |

If your project has **no** `src` folder, use `app/api/chat/route.ts` and `app/page.tsx` instead.

**Copy from this repo** (if you clone it) or from the official hackathon quickstart PDF.

Rules:

- Call LiteLLM **only** under `app/api/` (or `src/app/api/`).
- Never put keys in `NEXT_PUBLIC_*` variables.
- Confirm `.gitignore` contains `.env*` so `.env.local` is not committed.

---

## Part D — GitHub (once)

### D1. Git identity (one time)

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### D2. New repository on GitHub

1. https://github.com/new  
2. Name: e.g. `prior-art-scout`  
3. **Public**  
4. Do **not** add README, .gitignore, or license (you already have them locally)  
5. Create repository and keep the URL: `https://github.com/<username>/prior-art-scout.git`

### D3. First push

From the folder with `package.json`:

```powershell
git add .
git commit -m "chore: initial Next.js + Prior-Art Scout scaffold"
git branch -M main
git remote add origin https://github.com/<username>/prior-art-scout.git
git push -u origin main
```

**Safety check on GitHub:**

- `.env.local` must **not** appear in the file list.  
- Search the repo for `sk-` — must find **nothing**.

---

## Part E — Vercel (once)

1. https://vercel.com → **Add New → Project**  
2. Import your GitHub repo  
3. Framework: **Next.js** (auto)  
4. **Environment Variables** — add the same three names as `.env.local`:

   | Key | Value |
   |-----|--------|
   | `LITELLM_BASE_URL` | your gateway URL |
   | `LITELLM_API_KEY` | your key |
   | `LITELLM_MODEL` | e.g. `claude-sonnet` |

   Tip: paste all three lines from `.env.local` into the first Key box; Vercel may split them.

5. **Deploy**  
6. Open `https://<project-name>.vercel.app` in an **incognito** window and run the smoke test.

**Later key change:** Vercel → Project → Settings → Environment Variables → Edit → Deployments → … → **Redeploy**.

---

## Part F — Daily workflow

```powershell
# 1. Edit code, test at http://localhost:3000
npm run dev

# 2. Save and upload
git add .
git commit -m "feat: describe change"
git push
```

Vercel rebuilds `main` in 1–2 minutes. Green **Ready** in Deployments = live.

---

## Part G — Submit on the portal

| Field | What to paste |
|-------|----------------|
| GitHub | `https://github.com/<username>/prior-art-scout` |
| Live URL | Short **`.vercel.app`** domain (not a long preview link) |
| Summary | Up to 600 chars — see `README.md` for a draft |

Final checks:

- Incognito: live URL works end-to-end  
- Incognito: GitHub repo is visible  
- No `sk-` in the repo  
- Latest deployment is **Ready**

---

## Part H — What to build next (Prior-Art Scout)

After the smoke test works, add in order:

1. **`POST /api/scout`** — orchestration route (no LLM in the browser)  
2. **Tools** — `fetch` PatentsView, OpenAlex, arXiv from server code  
3. **Agents** (separate prompts / steps): Search → Analyst → Critic → (loop) → Writer  
4. **UI** — idea textarea + timeline of agent steps  

Free APIs (no paid keys required):

- PatentsView — https://search.patentsview.org/docs/docs/  
- OpenAlex — https://api.openalex.org/  
- arXiv — https://arxiv.org/help/api  

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `node` / `npm` not recognized | Reopen terminal or reboot after installing Node |
| Port 3000 in use | `npm run dev -- -p 3001` |
| AI works locally, not on Vercel | Add env vars on Vercel and **Redeploy** |
| Build fails on Vercel | Deployments → failed build → **Build Logs** |
| `curl` fails on Windows | Use `curl.exe`, not PowerShell’s `curl` alias |
| Pushed `.env.local` by mistake | Tell organizers immediately; rotate key; never rely on deleting the file alone |

---

## Using this repo instead of create-next-app

If you clone or copy this template from GitHub:

```powershell
cd C:\Users\s.khalil\Documents\Agent-a-thon
git clone https://github.com/<username>/prior-art-scout.git
cd prior-art-scout
npm install
copy .env.example .env.local
npm run dev
```

Then edit `.env.local` when you have LiteLLM credentials.