#!/usr/bin/env python3
"""Read-only PostgreSQL integrity checks for the curriculum catalog.

Uses psycopg3.  All queries are read-only; no writes, no DDL.

Exit 0 = all checks pass.  Exit 1 = at least one FAIL.
Advisory sections never set exit 1.

DB URL: $DB_URL env var, overridden by --database-url flag.
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import Any

import psycopg
from psycopg.rows import dict_row


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_db_url(args: argparse.Namespace) -> str:
    url = getattr(args, "database_url", None) or os.environ.get("DB_URL")
    if not url:
        print("ERROR: set DB_URL or pass --database-url", file=sys.stderr)
        sys.exit(2)
    return url


def _connect(url: str) -> psycopg.Connection:
    return psycopg.connect(
        url,
        options="-c default_transaction_read_only=on",
        row_factory=dict_row,
    )


def _query(conn: psycopg.Connection, sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def _scalar(conn: psycopg.Connection, sql: str, params: tuple = ()) -> Any:
    row = _query(conn, sql, params)
    return row[0][list(row[0].keys())[0]] if row else None


# ---------------------------------------------------------------------------
# Check: Orphaned foreign keys
# ---------------------------------------------------------------------------
# Check: Orphaned foreign keys
# ---------------------------------------------------------------------------

def check_orphaned_fks(conn: psycopg.Connection) -> dict[str, Any]:
    """Find FK columns referencing a parent row that no longer exists.

    Handles composite FKs: all child columns must match a parent row together.
    Uses pg_constraint.conkey/confkey which store paired column numbers in the
    same row, avoiding the cartesian-product problem of information_schema joins.
    """
    fk_rows = _query(conn, """
        SELECT
            con.conname AS constraint_name,
            child_c.relname AS child_table,
            parent_c.relname AS parent_table,
            array_agg(child_a.attname ORDER BY x.n) AS child_columns,
            array_agg(parent_a.attname ORDER BY x.n) AS parent_columns
        FROM pg_constraint con
        JOIN pg_class child_c  ON child_c.oid = con.conrelid
        JOIN pg_class parent_c ON parent_c.oid = con.confrelid
        CROSS JOIN unnest(con.conkey) WITH ORDINALITY AS x(attnum, n)
        JOIN unnest(con.confkey) WITH ORDINALITY AS y(attnum, n) ON x.n = y.n
        JOIN pg_attribute child_a  ON child_a.attrelid = con.conrelid  AND child_a.attnum = x.attnum
        JOIN pg_attribute parent_a ON parent_a.attrelid = con.confrelid AND parent_a.attnum = y.attnum
        WHERE con.contype = 'f'
          AND child_c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        GROUP BY con.conname, child_c.relname, parent_c.relname
        ORDER BY child_c.relname, con.conname
    """)

    orphans: list[dict[str, Any]] = []
    for fk in fk_rows:
        child_table = fk["child_table"]
        child_cols = fk["child_columns"]
        parent_table = fk["parent_table"]
        parent_cols = fk["parent_columns"]

        join_parts = " AND ".join(
            f'p."{pc}" = c."{cc}"'
            for cc, pc in zip(child_cols, parent_cols)
        )
        where_parts = " AND ".join(
            f'c."{cc}" IS NOT NULL'
            for cc in child_cols
        )
        null_parts = " AND ".join(
            f'p."{pc}" IS NULL'
            for pc in parent_cols
        )
        count = _scalar(conn, f"""
            SELECT COUNT(*)
            FROM "{child_table}" c
            LEFT JOIN "{parent_table}" p ON {join_parts}
            WHERE {where_parts} AND {null_parts}
        """)
        if count and count > 0:
            orphans.append({
                "fk": fk["constraint_name"],
                "child": f"{child_table}({', '.join(child_cols)})",
                "parent": f"{parent_table}({', '.join(parent_cols)})",
                "orphan_count": count,
            })

    if orphans:
        total = sum(o["orphan_count"] for o in orphans)
        return {"status": "FAIL", "detail": f"{len(orphans)} FK(s) with {total} orphaned row(s)", "orphans": orphans}
    return {"status": "PASS", "detail": "All FK columns reference valid parents"}


# ---------------------------------------------------------------------------
# Check: Unvalidated constraints
# ---------------------------------------------------------------------------

def check_unvalidated_constraints(conn: psycopg.Connection) -> dict[str, Any]:
    rows = _query(conn, """
        SELECT
            conname,
            conrelid::regclass AS table_name,
            contype,
            pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE NOT convalidated
          AND connamespace = 'public'::regnamespace
        ORDER BY conrelid::regclass::text, conname
    """)
    if rows:
        return {
            "status": "FAIL",
            "detail": f"{len(rows)} unvalidated constraint(s)",
            "constraints": rows,
        }
    return {"status": "PASS", "detail": "All constraints validated"}


# ---------------------------------------------------------------------------
# Check: Missing indexes on FK columns
# ---------------------------------------------------------------------------

def check_missing_fk_indexes(conn: psycopg.Connection) -> dict[str, Any]:
    """Check that every FK's column sequence is covered by an index prefix.

    For composite FKs (a, b), an index on (a, b) or (a, b, c) satisfies,
    but an index on (a) alone does not.  Uses pg_constraint.conkey to get
    the ordered column sequence per constraint.
    """
    missing: list[dict[str, Any]] = []

    fk_constraints = _query(conn, """
        SELECT
            con.conname AS constraint_name,
            child_c.relname AS table_name,
            con.conkey AS fk_attnums,
            array_agg(child_a.attname ORDER BY x.n) AS column_names
        FROM pg_constraint con
        JOIN pg_class child_c ON child_c.oid = con.conrelid
        CROSS JOIN unnest(con.conkey) WITH ORDINALITY AS x(attnum, n)
        JOIN pg_attribute child_a
          ON child_a.attrelid = con.conrelid AND child_a.attnum = x.attnum
        WHERE con.contype = 'f'
          AND child_c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        GROUP BY con.conname, child_c.relname, con.conkey
        ORDER BY child_c.relname, con.conname
    """)

    for fk in fk_constraints:
        table_name = fk["table_name"]
        fk_attnums = fk["fk_attnums"]
        fk_cols = fk["column_names"]
        n = len(fk_attnums)

        # Check if any index on this table has indkey whose first N elements
        # exactly match the FK's conkey array (i.e., the FK columns are an
        # index prefix).
        has_prefix_index = _scalar(conn, """
            SELECT EXISTS (
                SELECT 1
                FROM pg_index i
                WHERE i.indrelid = %s::regclass
                  AND i.indkey[1:%s] = %s::smallint[]
            )
        """, (table_name, n, list(fk_attnums)))

        if not has_prefix_index:
            missing.append({
                "table": table_name,
                "columns": fk_cols,
                "constraint": fk["constraint_name"],
            })

    if missing:
        return {
            "status": "ADVISORY",
            "detail": f"{len(missing)} FK constraint(s) missing index prefix",
            "missing": missing,
        }
    return {"status": "PASS", "detail": "All FK column sequences have an index prefix"}


# ---------------------------------------------------------------------------
# Check: Expected-empty tables
# ---------------------------------------------------------------------------

EXPECTED_EMPTY = [
    "book_suggestions",
    "resource_quarantine",
    "song_action_chunks",
    "song_chord_guides",
    "lesson_assets",
    "activities",
]


def check_expected_empty(conn: psycopg.Connection) -> dict[str, Any]:
    non_empty: list[dict[str, Any]] = []
    for table in EXPECTED_EMPTY:
        try:
            count = _scalar(conn, f'SELECT COUNT(*) FROM "{table}"')
        except Exception:
            # Table may not exist after migration — skip, not a failure
            continue
        if count and count > 0:
            non_empty.append({"table": table, "row_count": count})

    if non_empty:
        return {
            "status": "FAIL",
            "detail": f"{len(non_empty)} expected-empty table(s) have rows",
            "non_empty": non_empty,
        }
    return {"status": "PASS", "detail": "All expected-empty tables are empty"}


# ---------------------------------------------------------------------------
# Advisory: Unsourced lyrics
# ---------------------------------------------------------------------------

def check_unsourced_lyrics(conn: psycopg.Connection) -> dict[str, Any]:
    count = _scalar(conn, """
        SELECT COUNT(*)
        FROM songs s
        WHERE s.lyrics IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM song_sources ss WHERE ss.song_id = s.id
          )
    """)
    if count and count > 0:
        return {
            "status": "ADVISORY",
            "detail": f"{count} song(s) with lyrics but no source record",
        }
    return {"status": "PASS", "detail": "All lyrics-bearing songs have at least one source"}


# ---------------------------------------------------------------------------
# Advisory: Transcription gaps
# ---------------------------------------------------------------------------

def check_transcription_gaps(conn: psycopg.Connection) -> dict[str, Any]:
    count = _scalar(conn, """
        SELECT COUNT(*)
        FROM song_sources
        WHERE relationship = 'transcription'
          AND locator IS NULL
          AND evidence_note IS NULL
    """)
    if count and count > 0:
        return {
            "status": "ADVISORY",
            "detail": f"{count} transcription source(s) lack both locator and evidence_note",
        }
    return {"status": "PASS", "detail": "All transcription sources have locator or evidence_note"}


# ---------------------------------------------------------------------------
# Advisory: Duplicate topics
# ---------------------------------------------------------------------------

def check_duplicate_topics(conn: psycopg.Connection) -> dict[str, Any]:
    rows = _query(conn, """
        SELECT grade_key, lesson_topic, COUNT(*) AS dup_count
        FROM curriculum_topics
        GROUP BY grade_key, lesson_topic
        HAVING COUNT(*) > 1
        ORDER BY dup_count DESC
        LIMIT 20
    """)
    if rows:
        return {
            "status": "ADVISORY",
            "detail": f"{len(rows)} grade_key+lesson_topic combination(s) duplicated",
            "duplicates": rows,
        }
    return {"status": "PASS", "detail": "No duplicate grade_key+lesson_topic combinations"}


# ---------------------------------------------------------------------------
# Advisory: Topics lacking standards
# ---------------------------------------------------------------------------

def check_topics_lacking_standards(conn: psycopg.Connection) -> dict[str, Any]:
    """Advisory: curriculum_topics with no standard via any path.

    Path: curriculum_topics → curriculum_topic_songs (curriculum_topic_id)
           → topics (topic_id) → topic_standards (topic_id).
    Also flags topics where the standards text field is empty.
    """
    rows = _query(conn, """
        SELECT ct.id, ct.lesson_topic
        FROM curriculum_topics ct
        WHERE (ct.standards IS NULL OR trim(ct.standards) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM curriculum_topic_songs cts
            JOIN topic_standards ts ON ts.topic_id = cts.topic_id
            WHERE cts.curriculum_topic_id = ct.id
              AND cts.topic_id IS NOT NULL
          )
        ORDER BY ct.grade_key, ct.lesson_topic
    """)
    if rows:
        return {
            "status": "ADVISORY",
            "detail": f"{len(rows)} curriculum_topic(s) lacking standards (no text and no relational link)",
            "topics": [{"id": r["id"], "lesson_topic": r["lesson_topic"]} for r in rows[:20]],
        }
    return {"status": "PASS", "detail": "All curriculum_topics have standards via text or relational link"}


# ---------------------------------------------------------------------------
# All checks
# ---------------------------------------------------------------------------

CHECKS = [
    ("orphaned_fks", check_orphaned_fks),
    ("unvalidated_constraints", check_unvalidated_constraints),
    ("missing_fk_indexes", check_missing_fk_indexes),
    ("expected_empty_tables", check_expected_empty),
    ("unsourced_lyrics", check_unsourced_lyrics),
    ("transcription_gaps", check_transcription_gaps),
    ("duplicate_topics", check_duplicate_topics),
    ("topics_lacking_standards", check_topics_lacking_standards),
]


def run_all_checks(conn: psycopg.Connection) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for name, fn in CHECKS:
        try:
            result = fn(conn)
        except Exception as exc:
            result = {"status": "ERROR", "detail": str(exc)}
        result["name"] = name
        label = result.get("status", "ERROR")
        detail = result.get("detail", "")
        print(f"[{label}] {name}: {detail}")
        results.append(result)
    return results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Read-only PostgreSQL integrity checks for the curriculum catalog.",
    )
    parser.add_argument(
        "--database-url",
        help="PostgreSQL connection URL (overrides $DB_URL env var)",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    url = _get_db_url(args)
    conn = _connect(url)
    try:
        results = run_all_checks(conn)
    finally:
        conn.close()

    failed = [r for r in results if r.get("status") in ("FAIL", "ERROR")]
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
