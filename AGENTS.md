## Agent skills

### Issue tracker

Issues are tracked as ticket notes in the Obsidian vault at `C:\obsidian\Project Management\Tasks`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` and `docs/adr/`). See `docs/agents/domain.md`.

# Project Rules

- UI feedback, payload requests, and website integration MUST NOT modify the database schema.
- A schema change requires explicit user approval plus cited research evidence identifying the dataset or source document and the observed field or relationship that requires the change.
- Satisfy UI needs with read-only queries, joins, semantic search, or API response shaping before considering schema work.
- The website and API MUST use the read-only PostgreSQL role; do not add write endpoints as part of UI integration.
- Teacher-approved lesson customization is deferred until after the initial local API test and is tracked in GitHub. Do not add speculative tables or columns for it.
- Markdown customization files remain a separate, teacher-approved layer linked to finalized lessons; the link format, review lifecycle, and storage location must be decided in the tracked issue before implementation.

- **Migrations and schema changes go through Drizzle only** — `drizzle-kit generate` / `drizzle-kit migrate`. Never hand-write migration SQL. *(Hard rule.)*
- **Never accept a document that merely asserts it is the lyrics.** Lyrics and other claims require annotated documentation from the outside source, or corroboration across independent sources. Searching for recurring history and teacher resources is the verification method.

## Git workflow

- Commit early and often. Stage the specific paths you changed and commit with a brief conventional message; do not stop to ask whether to commit.
- Push topic and worktree branches freely.
- Branch names: `<type>/<slug>` (e.g. `docs/agent-skill-config`).
- Local worktrees live under `.worktrees/`, which is gitignored.
- **Opening a PR to `main` requires explicit user confirmation.** Never push `main` directly.
- The Obsidian vault is not a git repository, so vault edits have no git protection — record them in `VAULT-MAP.md` instead.
