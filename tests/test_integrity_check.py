#!/usr/bin/env python3
"""Behavioural tests for the integrity check's command-line contract.

No test framework: this is a plain script. Run it directly.
Exit 0 = all tests pass. Exit 1 = at least one test failed.

Everything is asserted through the command's *public* interface — its exit code
and its printed output — never against internals. The command can be rewritten
entirely and these tests should still hold.

The fixture source is deliberately the PostgreSQL migration SQL, which is a
different artifact from the Drizzle schema the implementation parses. Deriving
the expected table set the same way the implementation does would make these
tests tautological: they could never disagree with the code.
"""

from __future__ import annotations

import os
import re
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CHECK = REPO_ROOT / "scripts" / "db" / "integrity-check.py"
# The working store is not committed (data/ is gitignored), so it is absent in
# a fresh clone and in CI. Point OMHAS_STORE at a real store to run the
# positive cases; they skip otherwise.
REAL_STORE = Path(os.environ.get("OMHAS_STORE", REPO_ROOT / "data" / "omhas.db"))
MIGRATION_DIR = REPO_ROOT / "src" / "db" / "migrations-pg"

PASS, FAIL, SKIP = "PASS", "FAIL", "SKIP"
_results: list[tuple[str, str, str]] = []


def declared_tables_from_migration() -> list[str]:
    """Independent source of truth: the checked-in PostgreSQL migration."""
    sql = "\n".join(p.read_text(encoding="utf-8") for p in sorted(MIGRATION_DIR.glob("*.sql")))
    names = re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-z_]+)"?', sql, re.IGNORECASE)
    return sorted(set(names))


def run_check(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(CHECK), *args],
        capture_output=True,
        text=True,
        cwd=str(REPO_ROOT),
    )


def make_store(path: Path, tables: list[str]) -> None:
    """Create a store containing the given tables.

    `lesson_assets` is given its real shape because the markdown-link check
    asserts on it; a bare id column would fail that check for reasons unrelated
    to the schema-conformance question these fixtures exist to isolate.
    """
    conn = sqlite3.connect(path)
    try:
        for name in tables:
            if name == "lesson_assets":
                conn.execute(
                    'CREATE TABLE "lesson_assets" '
                    "(id INTEGER PRIMARY KEY, topic_id INTEGER, file_path TEXT)"
                )
            else:
                conn.execute(f'CREATE TABLE "{name}" (id INTEGER PRIMARY KEY)')
        conn.commit()
    finally:
        conn.close()


def check(name: str, condition: bool, detail: str = "") -> None:
    _results.append((PASS if condition else FAIL, name, detail))


def main() -> int:
    declared = declared_tables_from_migration()
    if not declared:
        print("FATAL: could not read any CREATE TABLE from the migration", file=sys.stderr)
        return 1
    print(f"declared tables (from migration SQL): {len(declared)}")

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)

        # --- A store missing declared tables must FAIL -----------------------
        empty = tmpdir / "empty.db"
        make_store(empty, [])
        r = run_check("--sqlite", str(empty))
        check(
            "store with no tables fails",
            r.returncode == 1,
            f"exit={r.returncode}",
        )
        check(
            "failure output names the missing table",
            "lesson_assets" in r.stdout,
            "expected a missing-table name in output",
        )

        # --- An extra undeclared table must FAIL -----------------------------
        extra = tmpdir / "extra.db"
        make_store(extra, declared + ["zzz_undeclared_table"])
        r = run_check("--sqlite", str(extra))
        check(
            "undeclared table fails",
            r.returncode == 1,
            f"exit={r.returncode}",
        )
        check(
            "failure output names the undeclared table",
            "zzz_undeclared_table" in r.stdout,
            "expected the undeclared table name in output",
        )

        # --- Internals must be ignored, not reported as drift ---------------
        # A store with the full declared set plus migration bookkeeping and FTS
        # shadow tables must PASS. Without this, every real store would
        # false-positive.
        # Note: SQLite reserves the `sqlite_` prefix, so `sqlite_sequence`
        # cannot be created in a fixture. Its exclusion is covered by the
        # real-store test below, which has that table.
        internals = tmpdir / "internals.db"
        make_store(
            internals,
            declared
            + [
                "__drizzle_migrations",
                "some_fts",
                "some_fts_data",
            ],
        )
        r = run_check("--sqlite", str(internals))
        check(
            "internal and full-text-search tables are ignored",
            r.returncode == 0,
            f"exit={r.returncode} out={r.stdout[-400:]}",
        )

        # --- A missing store is a skip, not a failure ----------------------
        # Continuous integration has no store (it is not committed), so
        # absence must never fail the build.
        r = run_check("--sqlite", str(tmpdir / "does-not-exist.db"))
        check(
            "absent store skips instead of failing",
            r.returncode == 0,
            f"exit={r.returncode}",
        )

    # --- The real store, when present ---------------------------------------
    if REAL_STORE.exists():
        r = run_check("--sqlite", str(REAL_STORE))
        check(
            "real working store passes",
            r.returncode == 0,
            f"exit={r.returncode} out={r.stdout[-400:]}",
        )
        check(
            "real run asserts the lesson markdown link",
            "lesson_assets" in r.stdout and "PASS" in r.stdout,
            "expected a PASS line mentioning lesson_assets",
        )
    else:
        _results.append((SKIP, "real working store passes", "no data/omhas.db in this checkout"))
        _results.append((SKIP, "real run asserts the lesson markdown link", "no data/omhas.db"))

    # --- Report -------------------------------------------------------------
    failed = 0
    for status, name, detail in _results:
        line = f"[{status}] {name}"
        if detail and status != PASS:
            line += f"  ({detail})"
        print(line)
        if status == FAIL:
            failed += 1

    print(f"\n{len(_results) - failed} passed, {failed} failed, "
          f"{sum(1 for s, _, _ in _results if s == SKIP)} skipped")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
