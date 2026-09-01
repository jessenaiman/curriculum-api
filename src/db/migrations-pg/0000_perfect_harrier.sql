CREATE TABLE "action_vocabulary" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"examples" text,
	"do_not_use_as_proof" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "action_vocabulary_category_unique" UNIQUE("category")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"type" text,
	"instructions" text,
	"materials_needed" text,
	"age_range" text,
	"duration_minutes" integer,
	"source_id" integer
);
--> statement-breakpoint
CREATE TABLE "book_suggestions" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text,
	"author" text,
	"description" text,
	"age_range" text,
	"isbn" text,
	"url" text
);
--> statement-breakpoint
CREATE TABLE "curriculum_topic_songs" (
	"id" text PRIMARY KEY NOT NULL,
	"curriculum_topic_id" text NOT NULL,
	"search_chunk_id" text NOT NULL,
	"link_type" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	"topic_id" integer
);
--> statement-breakpoint
CREATE TABLE "curriculum_topics" (
	"id" text PRIMARY KEY NOT NULL,
	"grade_key" text NOT NULL,
	"grade" text NOT NULL,
	"early_years" integer NOT NULL,
	"subject" text NOT NULL,
	"category" text,
	"seq_number" integer,
	"lesson_topic" text NOT NULL,
	"skill_statement" text,
	"standards" text,
	"song_count" integer DEFAULT 0,
	"linked_songs" text,
	"linked_resources" text,
	"tags" text,
	"circle_time_slot" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer,
	CONSTRAINT "grades_key_unique" UNIQUE("key"),
	CONSTRAINT "grades_key_check" CHECK ("grades"."key" IN ('daycare', 'preschool', 'kindergarten', 'grade-1', 'grade-2', 'grade-3'))
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "import_batches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"migration_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_path" text NOT NULL,
	"source_sha256" text NOT NULL,
	"imported_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_assets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lesson_assets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"topic_id" integer NOT NULL,
	"asset_type" text DEFAULT 'worksheet' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_path" text,
	"format" text,
	"generation_prompt" text,
	"visual_notes" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "material_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_kind" text NOT NULL,
	"from_id" integer NOT NULL,
	"relation_type" text,
	"to_kind" text NOT NULL,
	"to_id" integer NOT NULL,
	CONSTRAINT "material_relations_from_kind_check" CHECK ("material_relations"."from_kind" IN ('song', 'activity', 'book', 'resource')),
	CONSTRAINT "material_relations_relation_type_check" CHECK ("material_relations"."relation_type" IN ('has_song_version', 'has_video', 'has_lyrics_source', 'same_song', 'similar_activity', 'same_artist')),
	CONSTRAINT "material_relations_to_kind_check" CHECK ("material_relations"."to_kind" IN ('song', 'activity', 'book', 'resource'))
);
--> statement-breakpoint
CREATE TABLE "material_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_kind" text NOT NULL,
	"material_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "material_tags_material_kind_check" CHECK ("material_tags"."material_kind" IN ('song', 'activity', 'resource', 'book'))
);
--> statement-breakpoint
CREATE TABLE "planning_window_aliases" (
	"planning_window_id" integer NOT NULL,
	"alias" text NOT NULL,
	CONSTRAINT "planning_window_aliases_planning_window_id_alias_pk" PRIMARY KEY("planning_window_id","alias"),
	CONSTRAINT "planning_window_aliases_alias_unique" UNIQUE("alias")
);
--> statement-breakpoint
CREATE TABLE "planning_window_months" (
	"planning_window_id" integer NOT NULL,
	"month" text NOT NULL,
	CONSTRAINT "planning_window_months_planning_window_id_month_pk" PRIMARY KEY("planning_window_id","month"),
	CONSTRAINT "planning_window_months_month_check" CHECK ("planning_window_months"."month" IN ('Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'))
);
--> statement-breakpoint
CREATE TABLE "planning_windows" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "planning_windows_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "planning_windows_key_unique" UNIQUE("key"),
	CONSTRAINT "planning_windows_active_check" CHECK ("planning_windows"."active" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "research_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"priority" integer NOT NULL,
	"resource" text NOT NULL,
	"why_it_matters" text,
	"source_url" text,
	"download_filename" text,
	"assigned_to" text,
	"status" text DEFAULT 'Download needed',
	"notes" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "research_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"educator_org" text NOT NULL,
	"source_title" text NOT NULL,
	"source_type" text NOT NULL,
	"age_setting" text,
	"songs_covered" text,
	"direct_url" text,
	"local_pdf_filename" text,
	"download_status" text DEFAULT 'Download needed',
	"research_notes" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "resource_file_dispositions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resource_file_dispositions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"inventory_id" integer NOT NULL,
	"disposition" text NOT NULL,
	"material_kind" text,
	"material_id" integer,
	"evidence_note" text,
	"decided_by" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "resource_file_dispositions_disposition_check" CHECK ("resource_file_dispositions"."disposition" IN ('pending', 'processed', 'duplicate_reference', 'quarantined', 'unsupported', 'intentionally_excluded'))
);
--> statement-breakpoint
CREATE TABLE "resource_file_inventory" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resource_file_inventory_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source_path" text NOT NULL,
	"source_kind" text NOT NULL,
	"checksum" text NOT NULL,
	"byte_size" integer NOT NULL,
	"modified_at" text,
	"discovered_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"last_scanned_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "resource_file_inventory_source_path_unique" UNIQUE("source_path"),
	CONSTRAINT "resource_file_inventory_byte_size_check" CHECK ("resource_file_inventory"."byte_size" >= 0)
);
--> statement-breakpoint
CREATE TABLE "resource_page_evidence" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resource_page_evidence_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"inventory_id" integer NOT NULL,
	"source_document_id" integer,
	"page_number" integer NOT NULL,
	"assessment_method" text NOT NULL,
	"text_layer_state" text NOT NULL,
	"visual_review_state" text NOT NULL,
	"image_or_layout_present" integer DEFAULT 0 NOT NULL,
	"rendered_page_path" text,
	"evidence_notes" text,
	"reviewed_by" text,
	"reviewed_at" text,
	CONSTRAINT "resource_page_evidence_inventory_page_number_unique" UNIQUE("inventory_id","page_number"),
	CONSTRAINT "resource_page_evidence_page_number_check" CHECK ("resource_page_evidence"."page_number" > 0),
	CONSTRAINT "resource_page_evidence_assessment_method_check" CHECK ("resource_page_evidence"."assessment_method" IN ('text', 'vision', 'hybrid')),
	CONSTRAINT "resource_page_evidence_text_layer_state_check" CHECK ("resource_page_evidence"."text_layer_state" IN ('definitive', 'incomplete', 'unavailable', 'not-applicable')),
	CONSTRAINT "resource_page_evidence_visual_review_state_check" CHECK ("resource_page_evidence"."visual_review_state" IN ('not-required', 'pending', 'reviewed', 'not-applicable')),
	CONSTRAINT "resource_page_evidence_image_or_layout_present_check" CHECK ("resource_page_evidence"."image_or_layout_present" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "resource_quarantine" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resource_quarantine_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"inventory_id" integer NOT NULL,
	"record_locator" text,
	"reason_code" text NOT NULL,
	"evidence" text NOT NULL,
	"retry_status" text DEFAULT 'queued' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"resolution_note" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "resource_quarantine_retry_status_check" CHECK ("resource_quarantine"."retry_status" IN ('queued', 'retrying', 'resolved', 'needs_human', 'closed')),
	CONSTRAINT "resource_quarantine_retry_count_check" CHECK ("resource_quarantine"."retry_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"description" text,
	"url" text,
	"free" integer,
	"paywalled" integer,
	"verified" integer,
	"source_id" integer,
	CONSTRAINT "resources_type_check" CHECK ("resources"."type" in ('worksheet', 'video', 'activity', 'game', 'app', 'web')),
	CONSTRAINT "resources_free_check" CHECK ("resources"."free" in (0, 1)),
	CONSTRAINT "resources_paywalled_check" CHECK ("resources"."paywalled" in (0, 1)),
	CONSTRAINT "resources_verified_check" CHECK ("resources"."verified" in (0, 1))
);
--> statement-breakpoint
CREATE TABLE "retrieval_evaluation_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"query_text" text NOT NULL,
	"teacher_intent" text NOT NULL,
	"expected_title_contains" text,
	"expected_result_kind" text,
	"active" boolean DEFAULT true NOT NULL,
	"source_note" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "retrieval_evaluation_queries_query_text_unique" UNIQUE("query_text")
);
--> statement-breakpoint
CREATE TABLE "retrieval_evaluation_results" (
	"run_id" integer NOT NULL,
	"rank" integer NOT NULL,
	"result_kind" text NOT NULL,
	"result_id" text NOT NULL,
	"title" text NOT NULL,
	"match_scope" text,
	"score" real,
	CONSTRAINT "retrieval_evaluation_results_run_id_rank_pk" PRIMARY KEY("run_id","rank"),
	CONSTRAINT "retrieval_evaluation_results_rank_check" CHECK ("retrieval_evaluation_results"."rank" > 0)
);
--> statement-breakpoint
CREATE TABLE "retrieval_evaluation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_id" integer NOT NULL,
	"engine_kind" text NOT NULL,
	"engine_version" text,
	"duration_ms" integer NOT NULL,
	"result_count" integer NOT NULL,
	"expectation_met" boolean,
	"evaluator_note" text,
	"executed_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "retrieval_evaluation_runs_duration_check" CHECK ("retrieval_evaluation_runs"."duration_ms" >= 0),
	CONSTRAINT "retrieval_evaluation_runs_result_count_check" CHECK ("retrieval_evaluation_runs"."result_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "schema_migrations" (
	"migration_id" text PRIMARY KEY NOT NULL,
	"applied_at" text NOT NULL,
	"omhas_sha256" text NOT NULL,
	"curriculum_sha256" text NOT NULL,
	"generated_sha256" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_chunk_sources" (
	"search_chunk_id" text NOT NULL,
	"source_document_id" integer NOT NULL,
	CONSTRAINT "search_chunk_sources_search_chunk_id_source_document_id_pk" PRIMARY KEY("search_chunk_id","source_document_id")
);
--> statement-breakpoint
CREATE TABLE "search_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"source_path" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"chunk_text" text NOT NULL,
	"lyrics" text,
	"instructions" text,
	"embedding" text,
	"meta" text DEFAULT '{}',
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "song_action_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"song_action_id" text,
	"search_chunk_id" text,
	"created_at" text
);
--> statement-breakpoint
CREATE TABLE "song_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"song_title" text NOT NULL,
	"alternate_title" text,
	"tradition_performer" text,
	"action_wording" text,
	"action" text,
	"action_sequence" text,
	"song_cue" text,
	"action_classification" text,
	"core_or_optional" text,
	"age_range_stated" text,
	"educator_org" text,
	"source_title" text,
	"source_type" text,
	"page_timestamp" text,
	"source_url" text,
	"evidence_note" text,
	"research_status" text DEFAULT 'Not started',
	"reviewer_notes" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP,
	"updated_at" text DEFAULT CURRENT_TIMESTAMP,
	"song_id" integer,
	"section_id" integer,
	"line_number" integer,
	"provenance" text
);
--> statement-breakpoint
CREATE TABLE "song_chord_guides" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_id" integer NOT NULL,
	"section_id" integer,
	"scope" text NOT NULL,
	"line_number" integer,
	"progression" text NOT NULL,
	"musical_key" text,
	"capo" text,
	"tuning" text,
	"meter" text,
	"starting_pitch" text,
	"provenance" text NOT NULL,
	"source_note" text,
	"sort_order" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "song_chord_guides_scope_check" CHECK ("song_chord_guides"."scope" in ('song', 'section', 'line')),
	CONSTRAINT "song_chord_guides_provenance_check" CHECK ("song_chord_guides"."provenance" in ('source-documented', 'expert-suggested', 'community-legacy'))
);
--> statement-breakpoint
CREATE TABLE "song_curriculum_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_id" integer NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"relevance" text,
	"link_type" text DEFAULT 'curriculum' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_recordings" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_id" integer NOT NULL,
	"artist" text NOT NULL,
	"album" text,
	"year" integer,
	"key" text,
	"url" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "song_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_id" integer NOT NULL,
	"label" text,
	"section_type" text DEFAULT 'verse' NOT NULL,
	"sort_order" integer NOT NULL,
	"lyrics" text NOT NULL,
	"actions" text,
	"action_scope" text,
	"action_line_number" integer,
	"action_provenance" text,
	CONSTRAINT "song_sections_type_check" CHECK ("song_sections"."section_type" in ('verse', 'chorus', 'refrain', 'bridge', 'intro', 'outro', 'other')),
	CONSTRAINT "song_sections_action_scope_check" CHECK ("song_sections"."action_scope" in ('line', 'section', 'song')),
	CONSTRAINT "song_sections_action_provenance_check" CHECK ("song_sections"."action_provenance" in ('source-documented', 'expert-suggested', 'community-legacy'))
);
--> statement-breakpoint
CREATE TABLE "song_sources" (
	"song_id" integer NOT NULL,
	"source_document_id" integer NOT NULL,
	"relationship" text NOT NULL,
	"locator" text,
	"evidence_note" text,
	CONSTRAINT "song_sources_song_id_source_document_id_relationship_pk" PRIMARY KEY("song_id","source_document_id","relationship"),
	CONSTRAINT "song_sources_relationship_check" CHECK ("song_sources"."relationship" in ('primary', 'transcription', 'arrangement', 'teaching-guidance'))
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist" text,
	"catalog" text,
	"lyrics" text,
	"url" text,
	"instructions" text,
	"actions" text,
	"age_range" text,
	"source_id" integer,
	"verified" boolean DEFAULT false NOT NULL,
	"type" text,
	"educational_domain" text,
	"materials_needed" text,
	"tags" text,
	"creator_artist" text,
	"source_title" text,
	"curriculum_links" text,
	"early_years_links" text,
	"markdown_path" text
);
--> statement-breakpoint
CREATE TABLE "source_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_path" text NOT NULL,
	"source_kind" text NOT NULL,
	"review_state" text DEFAULT 'research_wip' NOT NULL,
	"checksum" text,
	"imported_at" text NOT NULL,
	CONSTRAINT "source_documents_source_path_unique" UNIQUE("source_path")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" integer PRIMARY KEY NOT NULL,
	"path_or_url" text,
	"type" text,
	"checksum" text
);
--> statement-breakpoint
CREATE TABLE "standards" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_standard_id" integer,
	"framework" text NOT NULL,
	"code" text,
	"full_text" text,
	"source" text,
	"external_id" text,
	"frames" text
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer,
	CONSTRAINT "subjects_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "suggested_curriculum_plan_placements" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"topic_grade_id" integer NOT NULL,
	"week_number" integer,
	"month" text,
	"source_locator" text,
	"relationship_note" text
);
--> statement-breakpoint
CREATE TABLE "suggested_curriculum_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"provenance_status" text NOT NULL,
	"source_document_id" integer,
	"source_locator" text,
	"active" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "suggested_curriculum_plans_key_unique" UNIQUE("key"),
	CONSTRAINT "suggested_curriculum_plans_active_check" CHECK ("suggested_curriculum_plans"."active" IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE "tag_aliases" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tag_aliases_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tag_id" integer NOT NULL,
	"alias" text NOT NULL,
	"provenance" text DEFAULT 'editorial' NOT NULL,
	CONSTRAINT "tag_aliases_tag_id_alias_unique" UNIQUE("tag_id","alias")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_tag_id" integer,
	"name" text NOT NULL,
	"definition" text
);
--> statement-breakpoint
CREATE TABLE "topic_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"grade_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"material_kind" text NOT NULL,
	"material_id" integer NOT NULL,
	"role" text,
	"use_in_phase" text,
	"routine_slot" text,
	"teacher_rationale" text,
	CONSTRAINT "topic_materials_material_kind_check" CHECK ("topic_materials"."material_kind" IN ('song', 'activity', 'book', 'resource')),
	CONSTRAINT "topic_materials_role_check" CHECK ("topic_materials"."role" IN ('focus', 'supporting')),
	CONSTRAINT "topic_materials_use_in_phase_check" CHECK ("topic_materials"."use_in_phase" IN ('opening', 'direct-instruction', 'guided-practice', 'independent-practice', 'closing')),
	CONSTRAINT "topic_materials_routine_slot_check" CHECK ("topic_materials"."routine_slot" IS NULL OR "topic_materials"."routine_slot" IN ('circle-time-core', 'greeting', 'transition', 'calm-down', 'goodbye'))
);
--> statement-breakpoint
CREATE TABLE "topic_standards" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"standard_id" integer NOT NULL,
	"alignment_notes" text
);
--> statement-breakpoint
CREATE TABLE "topic_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"category" text,
	"topic" text NOT NULL,
	"skill" text,
	"sequence" real,
	"taught_status" text,
	"merged_into" integer,
	"circle_time" text,
	"teacher_title" text,
	"teacher_summary" text,
	"teacher_title_state" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "topics_teacher_title_state_check" CHECK ("topics"."teacher_title_state" IN ('pending', 'editorial', 'education-reviewed'))
);
--> statement-breakpoint
CREATE TABLE "weekly_pacing" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_grade_id" integer NOT NULL,
	"week_number" integer,
	"month" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "curriculum_topic_songs" ADD CONSTRAINT "curriculum_topic_songs_search_chunk_id_search_chunks_id_fk" FOREIGN KEY ("search_chunk_id") REFERENCES "public"."search_chunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_topic_songs" ADD CONSTRAINT "curriculum_topic_songs_curriculum_topic_id_curriculum_topics_id_fk" FOREIGN KEY ("curriculum_topic_id") REFERENCES "public"."curriculum_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_topic_songs" ADD CONSTRAINT "curriculum_topic_songs_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_migration_id_schema_migrations_migration_id_fk" FOREIGN KEY ("migration_id") REFERENCES "public"."schema_migrations"("migration_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD CONSTRAINT "lesson_assets_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_tags" ADD CONSTRAINT "material_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_window_aliases" ADD CONSTRAINT "planning_window_aliases_planning_window_id_planning_windows_id_fk" FOREIGN KEY ("planning_window_id") REFERENCES "public"."planning_windows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_window_months" ADD CONSTRAINT "planning_window_months_planning_window_id_planning_windows_id_fk" FOREIGN KEY ("planning_window_id") REFERENCES "public"."planning_windows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_file_dispositions" ADD CONSTRAINT "resource_file_dispositions_inventory_id_resource_file_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."resource_file_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_page_evidence" ADD CONSTRAINT "resource_page_evidence_inventory_id_resource_file_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."resource_file_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_page_evidence" ADD CONSTRAINT "resource_page_evidence_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_quarantine" ADD CONSTRAINT "resource_quarantine_inventory_id_resource_file_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."resource_file_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_evaluation_results" ADD CONSTRAINT "retrieval_evaluation_results_run_id_retrieval_evaluation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."retrieval_evaluation_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_evaluation_runs" ADD CONSTRAINT "retrieval_evaluation_runs_query_id_retrieval_evaluation_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."retrieval_evaluation_queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_chunk_sources" ADD CONSTRAINT "search_chunk_sources_search_chunk_id_search_chunks_id_fk" FOREIGN KEY ("search_chunk_id") REFERENCES "public"."search_chunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_chunk_sources" ADD CONSTRAINT "search_chunk_sources_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_actions" ADD CONSTRAINT "song_actions_action_action_vocabulary_category_fk" FOREIGN KEY ("action") REFERENCES "public"."action_vocabulary"("category") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_actions" ADD CONSTRAINT "song_actions_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_actions" ADD CONSTRAINT "song_actions_section_id_song_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."song_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_chord_guides" ADD CONSTRAINT "song_chord_guides_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_chord_guides" ADD CONSTRAINT "song_chord_guides_section_id_song_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."song_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_curriculum_links" ADD CONSTRAINT "song_curriculum_links_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_recordings" ADD CONSTRAINT "song_recordings_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_sections" ADD CONSTRAINT "song_sections_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_sources" ADD CONSTRAINT "song_sources_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_sources" ADD CONSTRAINT "song_sources_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standards" ADD CONSTRAINT "standards_parent_standard_id_standards_id_fk" FOREIGN KEY ("parent_standard_id") REFERENCES "public"."standards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_curriculum_plan_placements" ADD CONSTRAINT "suggested_curriculum_plan_placements_plan_id_suggested_curriculum_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."suggested_curriculum_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_curriculum_plan_placements" ADD CONSTRAINT "suggested_curriculum_plan_placements_topic_grade_id_topic_grades_id_fk" FOREIGN KEY ("topic_grade_id") REFERENCES "public"."topic_grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggested_curriculum_plans" ADD CONSTRAINT "suggested_curriculum_plans_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_aliases" ADD CONSTRAINT "tag_aliases_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_parent_tag_id_tags_id_fk" FOREIGN KEY ("parent_tag_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_grades" ADD CONSTRAINT "topic_grades_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_grades" ADD CONSTRAINT "topic_grades_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_materials" ADD CONSTRAINT "topic_materials_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_standards" ADD CONSTRAINT "topic_standards_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_standards" ADD CONSTRAINT "topic_standards_standard_id_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."standards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_tags" ADD CONSTRAINT "topic_tags_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_tags" ADD CONSTRAINT "topic_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_merged_into_topics_id_fk" FOREIGN KEY ("merged_into") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_pacing" ADD CONSTRAINT "weekly_pacing_topic_grade_id_topic_grades_id_fk" FOREIGN KEY ("topic_grade_id") REFERENCES "public"."topic_grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "material_relations_from_kind_from_id_relation_type_to_kind_to_id_unique" ON "material_relations" USING btree ("from_kind","from_id","relation_type","to_kind","to_id");--> statement-breakpoint
CREATE UNIQUE INDEX "material_tags_material_kind_material_id_tag_id_unique" ON "material_tags" USING btree ("material_kind","material_id","tag_id");--> statement-breakpoint
CREATE INDEX "retrieval_evaluation_runs_query_idx" ON "retrieval_evaluation_runs" USING btree ("query_id","executed_at");--> statement-breakpoint
CREATE INDEX "idx_song_actions_action" ON "song_actions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_song_actions_song_id" ON "song_actions" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "song_chord_guides_song_idx" ON "song_chord_guides" USING btree ("song_id","scope","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "song_curriculum_links_identity_unique" ON "song_curriculum_links" USING btree ("song_id","subject","description",coalesce("relevance", ''),"link_type");--> statement-breakpoint
CREATE INDEX "idx_song_recordings_song_id" ON "song_recordings" USING btree ("song_id");--> statement-breakpoint
CREATE UNIQUE INDEX "song_sections_song_sort_unique" ON "song_sections" USING btree ("song_id","sort_order");--> statement-breakpoint
CREATE INDEX "song_sections_song_idx" ON "song_sections" USING btree ("song_id","sort_order");--> statement-breakpoint
CREATE INDEX "song_sources_song_idx" ON "song_sources" USING btree ("song_id");--> statement-breakpoint
CREATE UNIQUE INDEX "standards_framework_external_id_unique" ON "standards" USING btree ("framework","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suggested_curriculum_plan_placements_plan_id_topic_grade_id_week_number_month_unique" ON "suggested_curriculum_plan_placements" USING btree ("plan_id","topic_grade_id","week_number","month");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_parent_tag_id_name_unique" ON "tags" USING btree ("parent_tag_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_grades_topic_id_grade_id_unique" ON "topic_grades" USING btree ("topic_id","grade_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_materials_topic_id_material_kind_material_id_unique" ON "topic_materials" USING btree ("topic_id","material_kind","material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_standards_topic_id_standard_id_unique" ON "topic_standards" USING btree ("topic_id","standard_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_tags_topic_id_tag_id_unique" ON "topic_tags" USING btree ("topic_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_pacing_topic_grade_id_week_number_unique" ON "weekly_pacing" USING btree ("topic_grade_id","week_number");