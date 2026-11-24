# Claim Lab

**AGENT-A-THON** — multi-agent fact-check desk for bold public claims (marketing, pitch decks, articles).

You enter a one-sentence claim (e.g. *“This supplement improves memory in older adults”*). Specialist agents pull evidence from **free public APIs**, then an **advocate** and **critic** debate what the claim can and cannot say. A **writer** outputs a plain-language brief with links to trials, papers, and FDA-related records.

> **Not medical or legal advice** — a research and communication risk snapshot grounded in cited sources.

## How the agents work

| Agent | Role |
|--------|------|
| Planner | Breaks the claim into search queries |
| Trial scout | ClinicalTrials.gov |
| OpenAlex scout | OpenAlex |
| Europe PMC scout | Europe PMC |
| Crossref scout | Crossref (DOI metadata) |
| PubMed scout | PubMed (NCBI E-utilities) |
| Regulatory scout | openFDA (labels / events) |
| Advocate | Best supported reading of the evidence |
| Critic | Overreach, weak studies, missing proof |
| Writer | **Say** / **Don’t say** / **Need more proof** |

Orchestration lives in `POST /api/scout` (server-only). LiteLLM is called only from `app/api/*` — never from the browser.

## Local setup

See **[SETUP.md](./SETUP.md)** for Windows steps: Next.js, `.env.local`, GitHub, Vercel.

```powershell
cd C:\Users\s.khalil\Documents\Agent-a-thon
npm install
npm run dev
```

Open http://localhost:3000

### Environment

Create `.env.local` in the project root (never commit):

```env
LITELLM_BASE_URL=https://<gateway>/v1
LITELLM_API_KEY=sk-...
LITELLM_MODEL=claude-sonnet
```

## Hackathon submission draft (≤600 characters)

> Claim Lab runs specialist agents on ClinicalTrials.gov, OpenAlex, Europe PMC, and openFDA, then advocate and critic agents debate whether a public health or product claim is supported. A writer outputs say/don’t say guidance with citations. Multi-agent, API-grounded, not one chatbot.

Adjust wording to fit the portal limit.

## Tech stack

- Next.js (App Router), TypeScript, Tailwind
- OpenAI SDK → LiteLLM gateway
- Deploy: Vercel + public GitHub repo

## License

Private hackathon project unless you add a license file.