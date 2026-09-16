# Obsidian is the editorial staging layer

Content is authored and stored in the Obsidian vault first, and reaches the API and database afterwards. The vault is where curation and editorial work happen; `curriculum-api` is the published store.

## Considered Options

- **Author directly in the database.** Rejected: curation needs an editorial surface, and the database is served read-only to the teacher-facing site, with no write endpoints.

## Consequences

- Every content pipeline has a vault stage before its database stage. Liner notes are the first instance of this.
- Vault edits are **not** version-controlled — `C:\obsidian` is not a git repository — so content awaiting migration exists without git protection. The vault keeps its own append-only ledger (`VAULT-MAP.md`) instead.
