/**
 * PostgreSQL schema — faithful port of data/omhas.db
 *
 * This file re-exports every Drizzle table definition from the three group
 * fragments, preserving each group's declaration order:
 * core → songs/search → research/infra.
 *
 * Five tables were missing from the original Drizzle schema-sqlite.ts and
 * have been added here:
 *   1. planning_windows
 *   2. planning_window_aliases
 *   3. planning_window_months
 *   4. resource_page_evidence
 *   5. song_recordings
 *
 * Source of truth: local/actual-sqlite-ddl.sql
 */

import * as core from './schema-pg-core.js';
import * as songs from './schema-pg-songs.js';
import * as research from './schema-pg-research.js';

// ─── Core curriculum (normalized) ──────────────────────────────────────────

export const pgSubjects = core.pgSubjects;
export const pgGrades = core.pgGrades;
export const pgTopics = core.pgTopics;

// ─── Standards & Tags (declared before their join-table consumers) ────────

export const pgStandards = core.pgStandards;
export const pgTags = core.pgTags;

// ─── Topic join tables ─────────────────────────────────────────────────────

export const pgTopicGrades = core.pgTopicGrades;
export const pgTopicStandards = core.pgTopicStandards;
export const pgTopicTags = core.pgTopicTags;
export const pgTopicMaterials = core.pgTopicMaterials;
export const pgWeeklyPacing = core.pgWeeklyPacing;

// ─── Suggested curriculum plans ───────────────────────────────────────────

export const pgSuggestedCurriculumPlans = core.pgSuggestedCurriculumPlans;
export const pgSuggestedCurriculumPlanPlacements = core.pgSuggestedCurriculumPlanPlacements;

// ─── Material connections ──────────────────────────────────────────────────

export const pgMaterialTags = core.pgMaterialTags;
export const pgMaterialRelations = core.pgMaterialRelations;

// ─── Song curriculum links ────────────────────────────────────────────────

export const pgSongCurriculumLinks = core.pgSongCurriculumLinks;

// ─── Legacy flat curriculum (to be deprecated) ─────────────────────────────

export const pgCurriculumTopics = core.pgCurriculumTopics;

// ─── Songs / search / retrieval ────────────────────────────────────────────

export const pgSourceDocuments = songs.pgSourceDocuments;
export const pgActionVocabulary = songs.pgActionVocabulary;
export const pgSearchChunks = songs.pgSearchChunks;

// ─── Songs ────────────────────────────────────────────────────────────────

export const pgSongs = songs.pgSongs;
export const pgSongSections = songs.pgSongSections;
export const pgSongChordGuides = songs.pgSongChordGuides;
export const pgSongSources = songs.pgSongSources;
export const pgSongRecordings = songs.pgSongRecordings;
export const pgSongActions = songs.pgSongActions;
export const pgSongActionChunks = songs.pgSongActionChunks;

// ─── Resources ────────────────────────────────────────────────────────────

export const pgResources = songs.pgResources;

// ─── Search chunk sources ─────────────────────────────────────────────────

export const pgSearchChunkSources = songs.pgSearchChunkSources;

// ─── Curriculum topic songs ───────────────────────────────────────────────

export const pgCurriculumTopicSongs = songs.pgCurriculumTopicSongs;

// ─── Retrieval evaluation ─────────────────────────────────────────────────

export const pgRetrievalEvaluationQueries = songs.pgRetrievalEvaluationQueries;
export const pgRetrievalEvaluationRuns = songs.pgRetrievalEvaluationRuns;
export const pgRetrievalEvaluationResults = songs.pgRetrievalEvaluationResults;

// ─── Import tracking ──────────────────────────────────────────────────────

export const pgSchemaMigrations = research.pgSchemaMigrations;
export const pgImportBatches = research.pgImportBatches;

// ─── Planning windows ─────────────────────────────────────────────────────

export const pgPlanningWindows = research.pgPlanningWindows;
export const pgPlanningWindowAliases = research.pgPlanningWindowAliases;
export const pgPlanningWindowMonths = research.pgPlanningWindowMonths;

// ─── Research tracking ────────────────────────────────────────────────────

export const pgResearchQueue = research.pgResearchQueue;
export const pgResearchSources = research.pgResearchSources;

// ─── Resource file processing ─────────────────────────────────────────────

export const pgResourceFileInventory = research.pgResourceFileInventory;
export const pgResourceFileDispositions = research.pgResourceFileDispositions;
export const pgResourcePageEvidence = research.pgResourcePageEvidence;
export const pgResourceQuarantine = research.pgResourceQuarantine;

// ─── Lesson assets ────────────────────────────────────────────────────────

export const pgLessonAssets = research.pgLessonAssets;

// ─── Activities & Books (empty target tables for data parsing) ────────────

export const pgActivities = research.pgActivities;
export const pgBookSuggestions = research.pgBookSuggestions;

// ─── Sources ──────────────────────────────────────────────────────────────

export const pgSources = research.pgSources;

// ─── Tag aliases ──────────────────────────────────────────────────────────

export const pgTagAliases = research.pgTagAliases;