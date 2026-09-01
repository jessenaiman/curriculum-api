/**
 * PostgreSQL schema fragment — 16 research/infrastructure tables.
 *
 * Generated from local/actual-sqlite-ddl.sql. Timestamps stay text.
 * Non-exported stub tables (_pgTopics, _pgTags, _pgSourceDocuments) exist
 * solely to provide typed FK callbacks; the exported set is exactly 16 pgXxx consts.
 */
import { pgTable, text, integer, unique, check, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Internal stubs (not exported; FK callback targets only) ──────────────

const _pgTopics = pgTable('topics', {
  id: integer('id').primaryKey(),
});

const _pgTags = pgTable('tags', {
  id: integer('id').primaryKey(),
});

const _pgSourceDocuments = pgTable('source_documents', {
  id: integer('id').primaryKey(),
});

// ─── Import tracking ──────────────────────────────────────────────────────

export const pgSchemaMigrations = pgTable('schema_migrations', {
  migrationId: text('migration_id').primaryKey(),
  appliedAt: text('applied_at').notNull(),
  omhasSha256: text('omhas_sha256').notNull(),
  curriculumSha256: text('curriculum_sha256').notNull(),
  generatedSha256: text('generated_sha256').notNull(),
});

export const pgImportBatches = pgTable('import_batches', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  migrationId: text('migration_id').notNull().references(() => pgSchemaMigrations.migrationId),
  sourceName: text('source_name').notNull(),
  sourcePath: text('source_path').notNull(),
  sourceSha256: text('source_sha256').notNull(),
  importedAt: text('imported_at').notNull(),
});

// ─── Planning windows ─────────────────────────────────────────────────────

export const pgPlanningWindows = pgTable('planning_windows', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: integer('active').notNull().default(1),
}, (t) => [
  check('planning_windows_active_check', sql`${t.active} IN (0, 1)`),
]);

export const pgPlanningWindowAliases = pgTable('planning_window_aliases', {
  planningWindowId: integer('planning_window_id').notNull().references(() => pgPlanningWindows.id, { onDelete: 'cascade' }),
  alias: text('alias').notNull().unique(),
}, (t) => [
  primaryKey({ columns: [t.planningWindowId, t.alias] }),
]);

export const pgPlanningWindowMonths = pgTable('planning_window_months', {
  planningWindowId: integer('planning_window_id').notNull().references(() => pgPlanningWindows.id, { onDelete: 'cascade' }),
  month: text('month').notNull(),
}, (t) => [
  primaryKey({ columns: [t.planningWindowId, t.month] }),
  check('planning_window_months_month_check', sql`${t.month} IN ('Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun')`),
]);

// ─── Research tracking ────────────────────────────────────────────────────

export const pgResearchQueue = pgTable('research_queue', {
  id: text('id').primaryKey(),
  priority: integer('priority').notNull(),
  resource: text('resource').notNull(),
  whyItMatters: text('why_it_matters'),
  sourceUrl: text('source_url'),
  downloadFilename: text('download_filename'),
  assignedTo: text('assigned_to'),
  status: text('status').default('Download needed'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const pgResearchSources = pgTable('research_sources', {
  id: text('id').primaryKey(),
  educatorOrg: text('educator_org').notNull(),
  sourceTitle: text('source_title').notNull(),
  sourceType: text('source_type').notNull(),
  ageSetting: text('age_setting'),
  songsCovered: text('songs_covered'),
  directUrl: text('direct_url'),
  localPdfFilename: text('local_pdf_filename'),
  downloadStatus: text('download_status').default('Download needed'),
  researchNotes: text('research_notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── Resource file processing ─────────────────────────────────────────────

export const pgResourceFileInventory = pgTable('resource_file_inventory', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  sourcePath: text('source_path').notNull().unique(),
  sourceKind: text('source_kind').notNull(),
  checksum: text('checksum').notNull(),
  byteSize: integer('byte_size').notNull(),
  modifiedAt: text('modified_at'),
  discoveredAt: text('discovered_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  lastScannedAt: text('last_scanned_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  check('resource_file_inventory_byte_size_check', sql`${t.byteSize} >= 0`),
]);

export const pgResourceFileDispositions = pgTable('resource_file_dispositions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  inventoryId: integer('inventory_id').notNull().references(() => pgResourceFileInventory.id, { onDelete: 'cascade' }),
  disposition: text('disposition').notNull(),
  materialKind: text('material_kind'),
  materialId: integer('material_id'),
  evidenceNote: text('evidence_note'),
  decidedBy: text('decided_by').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  check('resource_file_dispositions_disposition_check', sql`${t.disposition} IN ('pending', 'processed', 'duplicate_reference', 'quarantined', 'unsupported', 'intentionally_excluded')`),
]);

export const pgResourcePageEvidence = pgTable('resource_page_evidence', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  inventoryId: integer('inventory_id').notNull().references(() => pgResourceFileInventory.id, { onDelete: 'cascade' }),
  sourceDocumentId: integer('source_document_id').references(() => _pgSourceDocuments.id, { onDelete: 'set null' }),
  pageNumber: integer('page_number').notNull(),
  assessmentMethod: text('assessment_method').notNull(),
  textLayerState: text('text_layer_state').notNull(),
  visualReviewState: text('visual_review_state').notNull(),
  imageOrLayoutPresent: integer('image_or_layout_present').notNull().default(0),
  renderedPagePath: text('rendered_page_path'),
  evidenceNotes: text('evidence_notes'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: text('reviewed_at'),
}, (t) => [
  unique('resource_page_evidence_inventory_page_number_unique').on(t.inventoryId, t.pageNumber),
  check('resource_page_evidence_page_number_check', sql`${t.pageNumber} > 0`),
  check('resource_page_evidence_assessment_method_check', sql`${t.assessmentMethod} IN ('text', 'vision', 'hybrid')`),
  check('resource_page_evidence_text_layer_state_check', sql`${t.textLayerState} IN ('definitive', 'incomplete', 'unavailable', 'not-applicable')`),
  check('resource_page_evidence_visual_review_state_check', sql`${t.visualReviewState} IN ('not-required', 'pending', 'reviewed', 'not-applicable')`),
  check('resource_page_evidence_image_or_layout_present_check', sql`${t.imageOrLayoutPresent} IN (0, 1)`),
]);

export const pgResourceQuarantine = pgTable('resource_quarantine', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  inventoryId: integer('inventory_id').notNull().references(() => pgResourceFileInventory.id, { onDelete: 'cascade' }),
  recordLocator: text('record_locator'),
  reasonCode: text('reason_code').notNull(),
  evidence: text('evidence').notNull(),
  retryStatus: text('retry_status').notNull().default('queued'),
  retryCount: integer('retry_count').notNull().default(0),
  resolutionNote: text('resolution_note'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  check('resource_quarantine_retry_status_check', sql`${t.retryStatus} IN ('queued', 'retrying', 'resolved', 'needs_human', 'closed')`),
  check('resource_quarantine_retry_count_check', sql`${t.retryCount} >= 0`),
]);

// ─── Lesson assets ────────────────────────────────────────────────────────

export const pgLessonAssets = pgTable('lesson_assets', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  topicId: integer('topic_id').notNull().references(() => _pgTopics.id),
  assetType: text('asset_type').notNull().default('worksheet'),
  title: text('title').notNull(),
  description: text('description'),
  filePath: text('file_path'),
  format: text('format'),
  generationPrompt: text('generation_prompt'),
  visualNotes: text('visual_notes'),
  status: text('status').notNull().default('draft'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── Activities & Books (empty target tables for data parsing) ────────────

export const pgActivities = pgTable('activities', {
  id: integer('id').primaryKey(),
  name: text('name'),
  type: text('type'),
  instructions: text('instructions'),
  materialsNeeded: text('materials_needed'),
  ageRange: text('age_range'),
  durationMinutes: integer('duration_minutes'),
  sourceId: integer('source_id'),
});

export const pgBookSuggestions = pgTable('book_suggestions', {
  id: integer('id').primaryKey(),
  title: text('title'),
  author: text('author'),
  description: text('description'),
  ageRange: text('age_range'),
  isbn: text('isbn'),
  url: text('url'),
});

export const pgSources = pgTable('sources', {
  id: integer('id').primaryKey(),
  pathOrUrl: text('path_or_url'),
  type: text('type'),
  checksum: text('checksum'),
});

// ─── Tag aliases ──────────────────────────────────────────────────────────

export const pgTagAliases = pgTable('tag_aliases', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  tagId: integer('tag_id').notNull().references(() => _pgTags.id, { onDelete: 'cascade' }),
  alias: text('alias').notNull(),
  provenance: text('provenance').notNull().default('editorial'),
}, (t) => [
  unique('tag_aliases_tag_id_alias_unique').on(t.tagId, t.alias),
]);
