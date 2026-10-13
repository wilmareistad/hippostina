# AI log – Hippostina

Significant decisions where AI was part of the process. One entry per decision.
Keep it short: what was decided, how AI was used, and how it was verified.

## Template

### YYYY-MM-DD – Short title
- **Context:** What problem or question I had.
- **AI tool / mode:** For example Claude Code (agent mode), chat for research.
- **AI suggestion:** What the AI proposed.
- **My decision:** What I chose, and if I changed or rejected the suggestion.
- **Verified against:** Official docs, tests, manual check, etc.

---

### 2026-10-13 – Project setup and CLAUDE.md
- **Context:** Starting the project. Needed a list of tools to install and a complete CLAUDE.md.
- **AI tool / mode:** Claude Code.
- **AI suggestion:** Install list (Node LTS, Angular CLI, Supabase CLI, Stripe CLI, Deno, optional Docker).
  Added rules to CLAUDE.md: atomic reservation, `reserved_until`, prices in öre,
  disable public sign-ups in Supabase Auth, storage policies, JWT off for the webhook function,
  and a commands and project structure section. Created this log and `go-live-checklist.md`.
- **My decision:** TODO
- **Verified against:** TODO

### 2026-10-13 – Database schema, RLS and table privileges
- **Context:** First migration for paintings, orders and admin-only writes.
- **AI tool / mode:** Claude Code.
- **AI suggestion:** `paintings` and `orders` tables, admin check via an `admins` table, RLS so visitors
  only see available paintings. The AI missed that this project does not grant table privileges by
  default, so a follow-up migration added the grants.
- **My decision:** Approved. Only available paintings are visible. My user is admin for now and will be
  replaced with Stina's later.
- **Verified against:** curl test as a logged-out visitor: paintings readable, everything else denied.
