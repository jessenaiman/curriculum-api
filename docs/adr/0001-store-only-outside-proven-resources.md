# The database stores only outside, proven resources

`curriculum-api` stores educational resources that originate **outside** this project and have been **proven** against their source. It does not store user- or LLM-created lesson planning, and it does not hold data belonging to other projects.

## Considered Options

- **Port the legacy lesson layer.** `C:\sites\curriculum-resources\data\curriculum.db` already holds 264 `lesson_blueprints` (every one `ready_for_review`), 1,056 `lesson_steps`, 1,991 `lesson_song_guidance` and 242 `lesson_resource_guidance` rows. Rejected: those rows are generated lesson planning, which this decision places outside the database's scope.
- **Add a lesson entity to Postgres.** Rejected for the same reason. The 17 tables the current ERD omits do not include a lesson table — that omission is now deliberate rather than an oversight.

## Consequences

- "Links to valid curriculum lessons" cannot be expressed as a link to a lesson row. The nearest available targets are `topics` + `topic_standards` + `suggested_curriculum_plan_placements`.
- A future engineer looking for a lesson table will not find one. That is the decision, not a gap to fill in.
