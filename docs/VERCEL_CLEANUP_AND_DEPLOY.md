# Vercel: Remove Old Portal Projects & Deploy ketchup-portals

The single **ketchup-portals** app (all four portals in one) replaces the previous split projects. To deploy it cleanly, remove the old Vercel projects first.

## Previous projects (Buffr team)

| Project           | Purpose (old)     | Action   |
|-------------------|-------------------|----------|
| **ketchup-portal**   | Ketchup-only app  | Remove   |
| **agent-portal**     | Agent-only app    | Remove   |
| **government-portal**| Government-only   | Remove   |

**ketchup-smartpay** has 0 deployments; you can keep or remove it.

## Remove old projects (CLI)

From any directory, with [Vercel CLI](https://vercel.com/docs/cli) installed and logged in:

```bash
# Use Buffr team
vercel switch buffr

# Remove the three old portal projects (deletes project + all deployments)
vercel remove ketchup-portal --yes
vercel remove agent-portal --yes
vercel remove government-portal --yes
```

To remove **ketchup-smartpay** as well:

```bash
vercel remove ketchup-smartpay --yes
```

## Deploy ketchup-portals

From the **ketchup-portals** repo root:

```bash
cd /path/to/ketchup-portals
vercel link    # choose Buffr team, create new project e.g. "ketchup-portals"
vercel --prod  # deploy to production
```

Then in Vercel Dashboard:

- **Domains:** Add **portal.ketchup.cc** (primary). Optionally add **admin.ketchup.cc**, **gov.ketchup.cc**, **agent.ketchup.cc** (and **mobile.ketchup.cc** if assigned to this project). See [DNS_AND_REDIRECTS.md](DNS_AND_REDIRECTS.md).
- **Environment variables:** Set for Production (and Preview if needed), e.g. `DATABASE_URL`, `NEXT_PUBLIC_PORTAL_URL` (e.g. `https://portal.ketchup.cc`), Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) if used, `NEON_AUTH_BASE_URL`, `NEXT_PUBLIC_NEON_AUTH_URL`, `NEON_AUTH_COOKIE_SECRET`, `BUFFR_API_URL`, `BUFFR_API_KEY`, SMTP vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`), and optional `CRON_SECRET`, `SMS_CRON_SECRET`, `SMS_*`.

## MCP / API

- **List teams:** `list_teams` → use `team_MPOdmWd6KnPpGhXI9UYg2Opo` (Buffr).
- **List projects:** `list_projects` with that `teamId`.
- **List deployments:** `list_deployments` with `projectId` + `teamId`.

There is no MCP tool to delete a project; use the CLI or [Delete a Project (REST API)](https://vercel.com/docs/rest-api/reference/endpoints/projects/delete-a-project).
