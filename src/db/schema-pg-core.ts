/**
 * PostgreSQL schema fragment — 16 core curriculum tables.
 *
 * Generated from local/actual-sqlite-ddl.sql. Timestamps stay text.
 * Non-exported stub tables (_pgSongs, _pgSourceDocuments) exist
 * solely to provide typed FK callbacks; the exported set is exactly 16 pgXxx consts.
 */
import { pgTable, text, integer, real, serial, uniqueIndex, check, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Internal stubs (not exported; FK callback targets only) ──────────────

const _pgSongs = pgTable('songs', {
  id: integer('id').primaryKey(),
});

const _pgSourceDocuments = pgTable('source_documents', {
  id: integer('id').primaryKey(),
});

// ─── Core curriculum (normalized) ──────────────────────────────────────────

export const pgSubjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order'),
});

export const pgGrades = pgTable('grades', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order'),
}, (t) => [
  check('grades_key_check', sql`${t.key} IN ('daycare', 'preschool', 'kindergarten', 'grade-1', 'grade-2', 'grade-3')`),
]);

export const pgTopics = pgTable('topics', {
  id: serial('id').primaryKey(),
  subjectId: integer('subject_id').notNull().references(() => pgSubjects.id, { onDelete: 'restrict' }),
  category: text('category'),
  topic: text('topic').notNull(),
  skill: text('skill'),
  sequence: real('sequence'),
  taughtStatus: text('taught_status'),
  mergedInto: integer('merged_into').references((): AnyPgColumn => pgTopics.id),
  circleTime: text('circle_time'),
  teacherTitle: text('teacher_title'),
  teacherSummary: text('teacher_summary'),
  teacherTitleState: text('teacher_title_state').notNull().default('pending'),
}, (t) => [
  check('topics_teacher_title_state_check', sql`${t.teacherTitleState} IN ('pending', 'editorial', 'education-reviewed')`),
]);

// ─── Standards & Tags (declared before their join-table consumers) ────────

export const pgStandards = pgTable('standards', {
  id: serial('id').primaryKey(),
  parentStandardId: integer('parent_standard_id').references((): AnyPgColumn => pgStandards.id, { onDelete: 'set null' }),
  framework: text('framework').notNull(),
  code: text('code'),
  fullText: text('full_text'),
  source: text('source'),
  externalId: text('external_id'),
  frames: text('frames'),
}, (t) => [
  uniqueIndex('standards_framework_external_id_unique').on(t.framework, t.externalId),
]);

export const pgTags = pgTable('tags', {
  id: serial('id').primaryKey(),
  parentTagId: integer('parent_tag_id').references((): AnyPgColumn => pgTags.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  definition: text('definition'),
}, (t) => [
  uniqueIndex('tags_parent_tag_id_name_unique').on(t.parentTagId, t.name),
]);

// ─── Topic join tables ─────────────────────────────────────────────────────

export const pgTopicGrades = pgTable('topic_grades', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id').notNull().references(() => pgTopics.id, { onDelete: 'cascade' }),
  gradeId: integer('grade_id').notNull().references(() => pgGrades.id, { onDelete: 'restrict' }),
}, (t) => [
  uniqueIndex('topic_grades_topic_id_grade_id_unique').on(t.topicId, t.gradeId),
]);

export const pgTopicStandards = pgTable('topic_standards', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id').notNull().references(() => pgTopics.id, { onDelete: 'cascade' }),
  standardId: integer('standard_id').notNull().references(() => pgStandards.id, { onDelete: 'restrict' }),
  alignmentNotes: text('alignment_notes'),
}, (t) => [
  uniqueIndex('topic_standards_topic_id_standard_id_unique').on(t.topicId, t.standardId),
]);

export const pgTopicTags = pgTable('topic_tags', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id').notNull().references(() => pgTopics.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => pgTags.id, { onDelete: 'cascade' }),
}, (t) => [
  uniqueIndex('topic_tags_topic_id_tag_id_unique').on(t.topicId, t.tagId),
]);

export const pgTopicMaterials = pgTable('topic_materials', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id').notNull().references(() => pgTopics.id, { onDelete: 'cascade' }),
  materialKind: text('material_kind').notNull(),
  materialId: integer('material_id').notNull(),
  role: text('role'),
  useInPhase: text('use_in_phase'),
  routineSlot: text('routine_slot'),
  teacherRationale: text('teacher_rationale'),
}, (t) => [
  uniqueIndex('topic_materials_topic_id_material_kind_material_id_unique').on(t.topicId, t.materialKind, t.materialId),
  check('topic_materials_material_kind_check', sql`${t.materialKind} IN ('song', 'activity', 'book', 'resource')`),
  check('topic_materials_role_check', sql`${t.role} IN ('focus', 'supporting')`),
  check('topic_materials_use_in_phase_check', sql`${t.useInPhase} IN ('opening', 'direct-instruction', 'guided-practice', 'independent-practice', 'closing')`),
  check('topic_materials_routine_slot_check', sql`${t.routineSlot} IS NULL OR ${t.routineSlot} IN ('circle-time-core', 'greeting', 'transition', 'calm-down', 'goodbye')`),
]);

export const pgWeeklyPacing = pgTable('weekly_pacing', {
  id: serial('id').primaryKey(),
  topicGradeId: integer('topic_grade_id').notNull().references(() => pgTopicGrades.id, { onDelete: 'cascade' }),
  weekNumber: integer('week_number'),
  month: text('month'),
  notes: text('notes'),
}, (t) => [
  uniqueIndex('weekly_pacing_topic_grade_id_week_number_unique').on(t.topicGradeId, t.weekNumber),
]);

// ─── Suggested curriculum plans ───────────────────────────────────────────

export const pgSuggestedCurriculumPlans = pgTable('suggested_curriculum_plans', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  description: text('description').notNull(),
  provenanceStatus: text('provenance_status').notNull(),
  sourceDocumentId: integer('source_document_id').references(() => _pgSourceDocuments.id, { onDelete: 'set null' }),
  sourceLocator: text('source_locator'),
  active: integer('active').notNull().default(1),
}, (t) => [
  check('suggested_curriculum_plans_provenance_status_check', sql`${t.provenanceStatus} IN ('source_backed', 'editorial', 'legacy_unverified')`),
  check('suggested_curriculum_plans_active_check', sql`${t.active} IN (0, 1)`),
]);

export const pgSuggestedCurriculumPlanPlacements = pgTable('suggested_curriculum_plan_placements', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').notNull().references(() => pgSuggestedCurriculumPlans.id, { onDelete: 'cascade' }),
  topicGradeId: integer('topic_grade_id').notNull().references(() => pgTopicGrades.id, { onDelete: 'cascade' }),
  weekNumber: integer('week_number'),
  month: text('month'),
  sourceLocator: text('source_locator'),
  relationshipNote: text('relationship_note'),
}, (t) => [
  uniqueIndex('suggested_curriculum_plan_placements_plan_id_topic_grade_id_week_number_month_unique').on(t.planId, t.topicGradeId, t.weekNumber, t.month),
]);

// ─── Material connections ──────────────────────────────────────────────────

export const pgMaterialTags = pgTable('material_tags', {
  id: serial('id').primaryKey(),
  materialKind: text('material_kind').notNull(),
  materialId: integer('material_id').notNull(),
  tagId: integer('tag_id').notNull().references(() => pgTags.id, { onDelete: 'cascade' }),
}, (t) => [
  uniqueIndex('material_tags_material_kind_material_id_tag_id_unique').on(t.materialKind, t.materialId, t.tagId),
  check('material_tags_material_kind_check', sql`${t.materialKind} IN ('song', 'activity', 'resource', 'book')`),
]);

export const pgMaterialRelations = pgTable('material_relations', {
  id: serial('id').primaryKey(),
  fromKind: text('from_kind').notNull(),
  fromId: integer('from_id').notNull(),
  relationType: text('relation_type'),
  toKind: text('to_kind').notNull(),
  toId: integer('to_id').notNull(),
}, (t) => [
  uniqueIndex('material_relations_from_kind_from_id_relation_type_to_kind_to_id_unique').on(t.fromKind, t.fromId, t.relationType, t.toKind, t.toId),
  check('material_relations_from_kind_check', sql`${t.fromKind} IN ('song', 'activity', 'book', 'resource')`),
  check('material_relations_relation_type_check', sql`${t.relationType} IN ('has_song_version', 'has_video', 'has_lyrics_source', 'same_song', 'similar_activity', 'same_artist')`),
  check('material_relations_to_kind_check', sql`${t.toKind} IN ('song', 'activity', 'book', 'resource')`),
]);

// ─── Song curriculum links ────────────────────────────────────────────────

export const pgSongCurriculumLinks = pgTable('song_curriculum_links', {
  id: serial('id').primaryKey(),
  songId: integer('song_id').notNull().references(() => _pgSongs.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  relevance: text('relevance'),
  linkType: text('link_type').notNull().default('curriculum'),
}, (t) => [
  uniqueIndex('song_curriculum_links_identity_unique').on(t.songId, t.subject, t.description, sql`coalesce(${t.relevance}, '')`, t.linkType),
]);

// ─── Legacy flat curriculum (to be deprecated) ─────────────────────────────

export const pgCurriculumTopics = pgTable('curriculum_topics', {
  id: text('id').primaryKey(),
  gradeKey: text('grade_key').notNull(),
  grade: text('grade').notNull(),
  earlyYears: integer('early_years').notNull(),
  subject: text('subject').notNull(),
  category: text('category'),
  seqNumber: integer('seq_number'),
  lessonTopic: text('lesson_topic').notNull(),
  skillStatement: text('skill_statement'),
  standards: text('standards'),
  songCount: integer('song_count').default(0),
  linkedSongs: text('linked_songs'),
  linkedResources: text('linked_resources'),
  tags: text('tags'),
  circleTimeSlot: text('circle_time_slot'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});