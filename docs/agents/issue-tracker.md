# Issue tracker: Obsidian

Issues and specs for this repo live as **ticket notes in the Obsidian vault**, not in GitHub Issues.

- Vault root: `C:\obsidian`
- Ticket folder: `C:\obsidian\Project Management\Tasks`
- Format precedent: `C:\obsidian\Projects\omega-spiral\Tasks`

## Vault layout and access

| Path | Access |
|---|---|
| `C:\obsidian\Project Management\` — `Tasks`, `Tickets`, `Events`, `Goals`, `Workflow Tasks` | **read + write** |
| `C:\obsidian\Projects\` | **READ-ONLY** — personal creative work, not to be revised or added to |
| Anything else in the vault | read-only unless the user says otherwise |

## Convention

**One file per ticket**, named `<id>.md` (e.g. `t1.md`, `vault-setup.md`), with a header table:

| Field | Value |
|---|---|
| id | t1 |
| status | needs-triage |
| owner | — |
| release | — |
| dependencies | none |
| updated | 2026-09-16 |

Then these sections, in order:

| Section | Holds |
|---|---|
| `## Acceptance` | What must be true for this to be done |
| `## Verify` | How it gets checked |
| `## Output` | The result once produced |
| `## Blocker` | What is stopping it, or `none` |
| `## Notes` | Freeform |

## Operations

- **Create an issue**: `write_file` to `C:\obsidian\Project Management\Tasks\<id>.md` using the header table above. Pick the next free `<id>`; `updated` is today's date.
- **Read an issue**: `read_file` on the ticket note.
- **List issues**: `search_files` with `target: "files"`, `pattern: "*.md"` under the ticket folder, then read each `status` row.
- **Find issues by state**: `search_files` with `target: "content"`, `pattern: "\| status \| <value> \|"`, `file_glob: "*.md"` under the ticket folder.
- **Comment on an issue**: `patch` to append under `## Notes`.
- **Apply / change a status**: `patch` the `status` row of the header table.
- **Close**: set `status` to `done`.

Do not use `gh issue` for this repo's work tracking. The GitHub remote exists for code, not for tickets.

## Status vocabulary

The five canonical triage roles, mapped in `docs/agents/triage-labels.md`:

`needs-triage` · `needs-info` · `ready-for-agent` · `ready-for-human` · `wontfix`

plus `done`, inherited from the `omega-spiral\Tasks` precedent to mark a closed ticket.

## Vault governance

- The vault has a canonical location ledger at `C:\obsidian\VAULT-MAP.md`, governed by the `maintaining-vault-map` skill (read the map → preflight → change → postflight → append-only log record). Register any new folder or storage location there. The ledger is the only location map — never create a second one.
- Application repositories stay **outside** the vault. Do not copy or link `C:\sites\curriculum-api` into `C:\obsidian`.
- Structural edits under `C:\obsidian\Projects\` are forbidden — that tree is read-only.

## When a skill says "publish to the issue tracker"

Create a ticket note under `C:\obsidian\Project Management\Tasks`.

## When a skill says "fetch the relevant ticket"

Read `C:\obsidian\Project Management\Tasks\<id>.md`.
