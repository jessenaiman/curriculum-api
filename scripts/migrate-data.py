#!/usr/bin/env python3
"""Load every user table from data/omhas.db into an empty PostgreSQL schema."""

import json
import os
import sqlite3
import sys
from pathlib import Path

try:
    import psycopg
    from psycopg import sql
except ImportError:
    sys.exit("psycopg3 required: pip install -r requirements.txt")

SQLITE_PATH = Path(__file__).resolve().parent.parent / "data" / "omhas.db"
EXCLUDED_TABLES = {
    "__drizzle_migrations",
    "sqlite_sequence",
    "search_chunks_fts",
    "search_chunks_fts_config",
    "search_chunks_fts_data",
    "search_chunks_fts_docsize",
    "search_chunks_fts_idx",
}


def source_tables(conn: sqlite3.Connection) -> list[str]:
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    ).fetchall()
    return [row[0] for row in rows if row[0] not in EXCLUDED_TABLES]


def load_order(conn: sqlite3.Connection, tables: list[str]) -> list[str]:
    remaining = set(tables)
    dependencies: dict[str, set[str]] = {}
    for table in tables:
        refs = {
            row[2]
            for row in conn.execute(f'PRAGMA foreign_key_list("{table}")')
            if row[2] != table and row[2] in remaining
        }
        dependencies[table] = refs

    ordered: list[str] = []
    while remaining:
        ready = sorted(table for table in remaining if not dependencies[table] & remaining)
        if not ready:
            raise RuntimeError(f"foreign-key cycle among: {', '.join(sorted(remaining))}")
        ordered.extend(ready)
        remaining.difference_update(ready)
    return ordered


def source_columns(conn: sqlite3.Connection, table: str) -> list[str]:
    return [row[1] for row in conn.execute(f'PRAGMA table_info("{table}")')]


def target_catalog(conn) -> dict[str, list[tuple[str, str, bool]]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_name, column_name, data_type, is_identity = 'YES'
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
            """
        )
        catalog: dict[str, list[tuple[str, str, bool]]] = {}
        for table, column, data_type, is_identity in cur:
            catalog.setdefault(table, []).append((column, data_type, is_identity))
        return catalog


def convert_value(value, target_type: str):
    if value is None:
        return None
    if target_type == "boolean":
        if value not in (0, 1, False, True):
            raise ValueError(f"boolean value must be 0 or 1, got {value!r}")
        return bool(value)
    return value


def validate_embedding(value, table: str, column: str) -> None:
    if table != "search_chunks" or column != "embedding" or value is None:
        return
    embedding = json.loads(value)
    if not isinstance(embedding, list) or len(embedding) != 384:
        length = len(embedding) if isinstance(embedding, list) else "not an array"
        raise ValueError(f"search_chunks.embedding must contain 384 values, got {length}")
    if not all(isinstance(item, (int, float)) and not isinstance(item, bool) for item in embedding):
        raise ValueError("search_chunks.embedding contains a non-numeric value")


def require_matching_catalog(
    sqlite_conn: sqlite3.Connection,
    tables: list[str],
    pg_catalog: dict[str, list[tuple[str, str, bool]]],
) -> None:
    source_set = set(tables)
    target_set = set(pg_catalog)
    if source_set != target_set:
        missing = sorted(source_set - target_set)
        extra = sorted(target_set - source_set)
        raise RuntimeError(f"table mismatch; missing={missing}, extra={extra}")

    for table in tables:
        source = source_columns(sqlite_conn, table)
        target = [column for column, _, _ in pg_catalog[table]]
        if source != target:
            raise RuntimeError(
                f"column mismatch for {table}; SQLite={source}, PostgreSQL={target}"
            )


def require_empty_target(conn, tables: list[str]) -> None:
    with conn.cursor() as cur:
        for table in tables:
            cur.execute(sql.SQL("SELECT count(*) FROM {}").format(sql.Identifier(table)))
            count = cur.fetchone()[0]
            if count:
                raise RuntimeError(f'target table "{table}" is not empty ({count} rows)')


def order_self_references(
    sqlite_conn: sqlite3.Connection,
    table: str,
    columns: list[str],
    rows: list[tuple],
) -> list[tuple]:
    foreign_keys: dict[int, list[tuple[str, str]]] = {}
    for fk_id, _, parent_table, child_column, parent_column, *_ in sqlite_conn.execute(
        f'PRAGMA foreign_key_list("{table}")'
    ):
        if parent_table == table:
            foreign_keys.setdefault(fk_id, []).append((child_column, parent_column))
    if not foreign_keys:
        return rows

    indexes = {column: index for index, column in enumerate(columns)}
    dependencies: list[set[int]] = [set() for _ in rows]
    for pairs in foreign_keys.values():
        parents = {
            tuple(row[indexes[parent]] for _, parent in pairs): row_index
            for row_index, row in enumerate(rows)
        }
        for row_index, row in enumerate(rows):
            parent_key = tuple(row[indexes[child]] for child, _ in pairs)
            if all(value is not None for value in parent_key):
                parent_index = parents.get(parent_key)
                if parent_index is not None and parent_index != row_index:
                    dependencies[row_index].add(parent_index)

    remaining = set(range(len(rows)))
    ordered: list[tuple] = []
    while remaining:
        ready = sorted(index for index in remaining if not dependencies[index] & remaining)
        if not ready:
            raise RuntimeError(f"self-referential foreign-key cycle in {table}")
        ordered.extend(rows[index] for index in ready)
        remaining.difference_update(ready)
    return ordered
def load_table(
    sqlite_conn: sqlite3.Connection,
    pg_conn,
    table: str,
    target_columns: list[tuple[str, str, bool]],
) -> int:
    columns = [column for column, _, _ in target_columns]
    types = [data_type for _, data_type, _ in target_columns]
    identity_override = any(is_identity for _, _, is_identity in target_columns)

    select_sql = "SELECT " + ", ".join(f'"{column}"' for column in columns)
    rows = sqlite_conn.execute(f'{select_sql} FROM "{table}"').fetchall()
    rows = order_self_references(sqlite_conn, table, columns, rows)
    converted = []
    for row_number, row in enumerate(rows, start=1):
        values = []
        for column, target_type, value in zip(columns, types, row, strict=True):
            try:
                validate_embedding(value, table, column)
                values.append(convert_value(value, target_type))
            except (TypeError, ValueError, json.JSONDecodeError) as exc:
                raise ValueError(f"{table} row {row_number}, column {column}: {exc}") from exc
        converted.append(values)

    if not converted:
        return 0

    statement = sql.SQL("INSERT INTO {} ({}) {} VALUES ({})").format(
        sql.Identifier(table),
        sql.SQL(", ").join(map(sql.Identifier, columns)),
        sql.SQL("OVERRIDING SYSTEM VALUE") if identity_override else sql.SQL(""),
        sql.SQL(", ").join(sql.Placeholder() for _ in columns),
    )
    with pg_conn.cursor() as cur:
        cur.executemany(statement, converted)
    return len(converted)


def reset_sequences(conn, tables: list[str]) -> list[tuple[str, str, int]]:
    reset: list[tuple[str, str, int]] = []
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_name, column_name,
                   pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name)
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND (is_identity = 'YES' OR column_default LIKE 'nextval(%')
            ORDER BY table_name, ordinal_position
            """
        )
        sequences = [row for row in cur if row[0] in tables and row[2]]

        for table, column, sequence in sequences:
            cur.execute(
                sql.SQL("SELECT max({}) FROM {}").format(
                    sql.Identifier(column), sql.Identifier(table)
                )
            )
            maximum = cur.fetchone()[0]
            if maximum is None:
                cur.execute("SELECT setval(%s::regclass, 1, false)", (sequence,))
                next_value = 1
            else:
                cur.execute("SELECT setval(%s::regclass, %s, true)", (sequence, maximum))
                next_value = maximum + 1
            reset.append((table, column, next_value))
    return reset


def verify_counts(
    sqlite_conn: sqlite3.Connection, pg_conn, tables: list[str]
) -> tuple[int, list[str]]:
    total = 0
    mismatches: list[str] = []
    with pg_conn.cursor() as cur:
        for table in tables:
            source_count = sqlite_conn.execute(
                f'SELECT count(*) FROM "{table}"'
            ).fetchone()[0]
            cur.execute(sql.SQL("SELECT count(*) FROM {}").format(sql.Identifier(table)))
            target_count = cur.fetchone()[0]
            total += source_count
            if source_count != target_count:
                mismatches.append(f"{table}: SQLite={source_count}, PostgreSQL={target_count}")
    return total, mismatches


def main() -> int:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is required", file=sys.stderr)
        return 1
    if not SQLITE_PATH.exists():
        print(f"SQLite database not found: {SQLITE_PATH}", file=sys.stderr)
        return 1

    sqlite_uri = f"file:{SQLITE_PATH.as_posix()}?mode=ro"
    try:
        with sqlite3.connect(sqlite_uri, uri=True) as sqlite_conn:
            tables = source_tables(sqlite_conn)
            if len(tables) != 48:
                raise RuntimeError(f"expected 48 source tables, found {len(tables)}")

            with psycopg.connect(database_url) as pg_conn:
                catalog = target_catalog(pg_conn)
                require_matching_catalog(sqlite_conn, tables, catalog)
                require_empty_target(pg_conn, tables)

                inserted = 0
                for table in load_order(sqlite_conn, tables):
                    count = load_table(sqlite_conn, pg_conn, table, catalog[table])
                    inserted += count
                    print(f"{table}: {count}")

                sequences = reset_sequences(pg_conn, tables)
                total, mismatches = verify_counts(sqlite_conn, pg_conn, tables)
                if mismatches:
                    raise RuntimeError("row-count mismatch: " + "; ".join(mismatches))

                print(
                    f"OK: {len(tables)} tables, {total} rows, "
                    f"{len(sequences)} sequences reset"
                )
                if inserted != total:
                    raise RuntimeError(f"inserted {inserted} rows but source contains {total}")
        return 0
    except Exception as exc:
        print(f"FAILED: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
