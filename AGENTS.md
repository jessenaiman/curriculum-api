# Project Rules

- UI feedback, payload requests, and website integration MUST NOT modify the database schema.
- A schema change requires explicit user approval plus cited research evidence identifying the dataset or source document and the observed field or relationship that requires the change.
- Satisfy UI needs with read-only queries, joins, semantic search, or API response shaping before considering schema work.
- The website and API MUST use the read-only PostgreSQL role; do not add write endpoints as part of UI integration.
- Teacher-approved lesson customization is deferred until after the initial local API test and is tracked in GitHub. Do not add speculative tables or columns for it.
- Markdown customization files remain a separate, teacher-approved layer linked to finalized lessons; the link format, review lifecycle, and storage location must be decided in the tracked issue before implementation.
