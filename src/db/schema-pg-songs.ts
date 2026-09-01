/**
 * PostgreSQL schema fragment — songs / search / retrieval tables.
 * Source of truth: local/actual-sqlite-ddl.sql (exact column names, nullability, defaults, PKs, FKs).
 * Exported consts are prefixed `pg` to avoid collision with other schema groups.
 *
 * Declared in module dependency order: inline `references()` callbacks resolve
 * eagerly at module evaluation, so a referenced table must be bound earlier in
 * this file. Cross-group targets below are consumed lazily through extra-config
 * `foreignKey` callbacks (resolved at SQL-build time), which breaks the ESM cycle
 * with schema-pg-core.ts safely.
 */
import { pgTable, serial, integer, text, boolean, real, primaryKey, uniqueIndex, index, check, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { pgCurriculumTopics, pgTopics } from './schema-pg-core';
import { pgSources } from './schema-pg-research';

// ─── Dependency-free tables (referenced by later tables) ─────────────────

export const pgSourceDocuments = pgTable('source_documents', {
  id:          serial('id').primaryKey(),
  sourcePath:  text('source_path').notNull().unique(),
  sourceKind:  text('source_kind').notNull(),
  reviewState: text('review_state').notNull().default('research_wip'),
  checksum:    text('checksum'),
  importedAt:  text('imported_at').notNull(),
});

export const pgActionVocabulary = pgTable('action_vocabulary', {
  id:              text('id').primaryKey(),
  category:        text('category').notNull().unique(),
  examples:        text('examples'),
  doNotUseAsProof: text('do_not_use_as_proof'),
  createdAt:       text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const pgSearchChunks = pgTable('search_chunks', {
  id:          text('id').primaryKey(),
  kind:        text('kind').notNull(),
  sourcePath:  text('source_path').notNull(),
  url:         text('url').notNull(),
  title:       text('title').notNull(),
  chunkText:   text('chunk_text').notNull(),
  lyrics:      text('lyrics'),
  instructions: text('instructions'),
  embedding:   text('embedding'),
  meta:        text('meta').default('{}'),
  createdAt:   text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── Songs ────────────────────────────────────────────────────────────────

export const pgSongs = pgTable('songs', {
  id:              serial('id').primaryKey(),
  title:           text('title').notNull(),
  artist:          text('artist'),
  catalog:         text('catalog'),
  lyrics:          text('lyrics'),
  url:             text('url'),
  instructions:    text('instructions'),
  actions:         text('actions'),
  ageRange:        text('age_range'),
  sourceId:        integer('source_id'),
  // SQLite: INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)) → boolean
  verified:        boolean('verified').notNull().default(false),
  type:            text('type'),
  educationalDomain: text('educational_domain'),
  materialsNeeded: text('materials_needed'),
  tags:            text('tags'),
  creatorArtist:   text('creator_artist'),
  sourceTitle:     text('source_title'),
  curriculumLinks: text('curriculum_links'),
  earlyYearsLinks: text('early_years_links'),
  markdownPath:    text('markdown_path'),
}, (t) => [
  // FOREIGN KEY (source_id) REFERENCES "sources" (id) ON DELETE SET NULL
  foreignKey({ columns: [t.sourceId], foreignColumns: [pgSources.id] }).onDelete('set null'),
]);

// ─── Song sections ────────────────────────────────────────────────────────

export const pgSongSections = pgTable('song_sections', {
  id:              serial('id').primaryKey(),
  songId:          integer('song_id').notNull().references(() => pgSongs.id, { onDelete: 'cascade' }),
  label:           text('label'),
  sectionType:     text('section_type').notNull().default('verse'),
  sortOrder:       integer('sort_order').notNull(),
  lyrics:          text('lyrics').notNull(),
  actions:         text('actions'),
  actionScope:     text('action_scope'),
  actionLineNumber: integer('action_line_number'),
  actionProvenance: text('action_provenance'),
}, (t) => [
  check('song_sections_type_check', sql`${t.sectionType} in ('verse', 'chorus', 'refrain', 'bridge', 'intro', 'outro', 'other')`),
  check('song_sections_action_scope_check', sql`${t.actionScope} in ('line', 'section', 'song')`),
  check('song_sections_action_provenance_check', sql`${t.actionProvenance} in ('source-documented', 'expert-suggested', 'community-legacy')`),
  // UNIQUE (song_id, sort_order)
  uniqueIndex('song_sections_song_sort_unique').on(t.songId, t.sortOrder),
  index('song_sections_song_idx').on(t.songId, t.sortOrder),
]);

// ─── Song chord guides ────────────────────────────────────────────────────

export const pgSongChordGuides = pgTable('song_chord_guides', {
  id:              serial('id').primaryKey(),
  songId:          integer('song_id').notNull().references(() => pgSongs.id, { onDelete: 'cascade' }),
  sectionId:       integer('section_id').references(() => pgSongSections.id, { onDelete: 'cascade' }),
  scope:           text('scope').notNull(),
  lineNumber:      integer('line_number'),
  progression:     text('progression').notNull(),
  musicalKey:      text('musical_key'),
  capo:            text('capo'),
  tuning:          text('tuning'),
  meter:           text('meter'),
  startingPitch:   text('starting_pitch'),
  provenance:      text('provenance').notNull(),
  sourceNote:      text('source_note'),
  sortOrder:       integer('sort_order').notNull().default(1),
}, (t) => [
  check('song_chord_guides_scope_check', sql`${t.scope} in ('song', 'section', 'line')`),
  check('song_chord_guides_provenance_check', sql`${t.provenance} in ('source-documented', 'expert-suggested', 'community-legacy')`),
  index('song_chord_guides_song_idx').on(t.songId, t.scope, t.sortOrder),
]);

// ─── Song sources (composite PK) ──────────────────────────────────────────

export const pgSongSources = pgTable('song_sources', {
  songId:           integer('song_id').notNull().references(() => pgSongs.id, { onDelete: 'cascade' }),
  sourceDocumentId: integer('source_document_id').notNull().references(() => pgSourceDocuments.id, { onDelete: 'cascade' }),
  relationship:     text('relationship').notNull(),
  locator:          text('locator'),
  evidenceNote:     text('evidence_note'),
}, (t) => [
  check('song_sources_relationship_check', sql`${t.relationship} in ('primary', 'transcription', 'arrangement', 'teaching-guidance')`),
  primaryKey({ columns: [t.songId, t.sourceDocumentId, t.relationship] }),
  index('song_sources_song_idx').on(t.songId),
]);

// ─── Song recordings ──────────────────────────────────────────────────────

export const pgSongRecordings = pgTable('song_recordings', {
  id:         serial('id').primaryKey(),
  songId:     integer('song_id').notNull().references(() => pgSongs.id, { onDelete: 'cascade' }),
  artist:     text('artist').notNull(),
  album:      text('album'),
  year:       integer('year'),
  key:        text('key'),
  url:        text('url'),
  notes:      text('notes'),
}, (t) => [
  index('idx_song_recordings_song_id').on(t.songId),
]);

// ─── Song actions ─────────────────────────────────────────────────────────

export const pgSongActions = pgTable('song_actions', {
  id:                    text('id').primaryKey(),
  songTitle:             text('song_title').notNull(),
  alternateTitle:        text('alternate_title'),
  traditionPerformer:    text('tradition_performer'),
  actionWording:         text('action_wording'),
  action:                text('action').references(() => pgActionVocabulary.category),
  actionSequence:        text('action_sequence'),
  songCue:               text('song_cue'),
  actionClassification:  text('action_classification'),
  coreOrOptional:        text('core_or_optional'),
  ageRangeStated:        text('age_range_stated'),
  educatorOrg:           text('educator_org'),
  sourceTitle:           text('source_title'),
  sourceType:            text('source_type'),
  pageTimestamp:         text('page_timestamp'),
  sourceUrl:             text('source_url'),
  evidenceNote:          text('evidence_note'),
  researchStatus:        text('research_status').default('Not started'),
  reviewerNotes:         text('reviewer_notes'),
  createdAt:             text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt:             text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  songId:                integer('song_id').references(() => pgSongs.id, { onDelete: 'cascade' }),
  sectionId:             integer('section_id').references(() => pgSongSections.id, { onDelete: 'set null' }),
  lineNumber:            integer('line_number'),
  provenance:            text('provenance'),
}, (t) => [
  index('idx_song_actions_action').on(t.action),
  index('idx_song_actions_song_id').on(t.songId),
]);

// ─── Song action chunks (no declared FKs in DDL) ──────────────────────────

export const pgSongActionChunks = pgTable('song_action_chunks', {
  id:            text('id').primaryKey(),
  songActionId:  text('song_action_id'),
  searchChunkId: text('search_chunk_id'),
  createdAt:     text('created_at'),
});

// ─── Resources ────────────────────────────────────────────────────────────

export const pgResources = pgTable('resources', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  type:        text('type'),
  description: text('description'),
  url:         text('url'),
  free:        integer('free'),
  paywalled:   integer('paywalled'),
  verified:    integer('verified'),
  sourceId:    integer('source_id'),
}, (t) => [
  check('resources_type_check', sql`${t.type} in ('worksheet', 'video', 'activity', 'game', 'app', 'web')`),
  check('resources_free_check', sql`${t.free} in (0, 1)`),
  check('resources_paywalled_check', sql`${t.paywalled} in (0, 1)`),
  check('resources_verified_check', sql`${t.verified} in (0, 1)`),
  // FOREIGN KEY (source_id) REFERENCES "sources" (id) ON DELETE SET NULL
  foreignKey({ columns: [t.sourceId], foreignColumns: [pgSources.id] }).onDelete('set null'),
]);

// ─── Search chunk sources (composite PK) ──────────────────────────────────

export const pgSearchChunkSources = pgTable('search_chunk_sources', {
  searchChunkId:    text('search_chunk_id').notNull().references(() => pgSearchChunks.id, { onDelete: 'cascade' }),
  sourceDocumentId: integer('source_document_id').notNull().references(() => pgSourceDocuments.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.searchChunkId, t.sourceDocumentId] }),
]);

// ─── Curriculum topic songs ───────────────────────────────────────────────

export const pgCurriculumTopicSongs = pgTable('curriculum_topic_songs', {
  id:                  text('id').primaryKey(),
  curriculumTopicId:   text('curriculum_topic_id').notNull(),
  searchChunkId:       text('search_chunk_id').notNull().references(() => pgSearchChunks.id, { onDelete: 'cascade' }),
  linkType:            text('link_type'),
  createdAt:           text('created_at').default(sql`CURRENT_TIMESTAMP`),
  topicId:             integer('topic_id'),
}, (t) => [
  // FOREIGN KEY (curriculum_topic_id) REFERENCES curriculum_topics(id) ON DELETE CASCADE
  foreignKey({ columns: [t.curriculumTopicId], foreignColumns: [pgCurriculumTopics.id] }).onDelete('cascade'),
  // INLINE ref: topic_id INTEGER REFERENCES "topics"(id)
  foreignKey({ columns: [t.topicId], foreignColumns: [pgTopics.id] }),
]);

// ─── Retrieval evaluation queries ─────────────────────────────────────────

export const pgRetrievalEvaluationQueries = pgTable('retrieval_evaluation_queries', {
  id:                      serial('id').primaryKey(),
  category:                text('category').notNull(),
  queryText:               text('query_text').notNull().unique(),
  teacherIntent:           text('teacher_intent').notNull(),
  expectedTitleContains:   text('expected_title_contains'),
  expectedResultKind:      text('expected_result_kind'),
  active:                  boolean('active').notNull().default(true),
  sourceNote:              text('source_note'),
  createdAt:               text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Retrieval evaluation runs ────────────────────────────────────────────

export const pgRetrievalEvaluationRuns = pgTable('retrieval_evaluation_runs', {
  id:             serial('id').primaryKey(),
  queryId:        integer('query_id').notNull().references(() => pgRetrievalEvaluationQueries.id, { onDelete: 'cascade' }),
  engineKind:     text('engine_kind').notNull(),
  engineVersion:  text('engine_version'),
  durationMs:     integer('duration_ms').notNull(),
  resultCount:    integer('result_count').notNull(),
  expectationMet: boolean('expectation_met'),
  evaluatorNote:  text('evaluator_note'),
  executedAt:     text('executed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  check('retrieval_evaluation_runs_duration_check', sql`${t.durationMs} >= 0`),
  check('retrieval_evaluation_runs_result_count_check', sql`${t.resultCount} >= 0`),
  index('retrieval_evaluation_runs_query_idx').on(t.queryId, t.executedAt),
]);

// ─── Retrieval evaluation results (composite PK) ──────────────────────────

export const pgRetrievalEvaluationResults = pgTable('retrieval_evaluation_results', {
  runId:       integer('run_id').notNull().references(() => pgRetrievalEvaluationRuns.id, { onDelete: 'cascade' }),
  rank:        integer('rank').notNull(),
  resultKind:  text('result_kind').notNull(),
  resultId:    text('result_id').notNull(),
  title:       text('title').notNull(),
  matchScope:  text('match_scope'),
  score:       real('score'),
}, (t) => [
  check('retrieval_evaluation_results_rank_check', sql`${t.rank} > 0`),
  primaryKey({ columns: [t.runId, t.rank] }),
]);