import { createServer } from "node:http";
import pg from "pg";

const { Pool } = pg;

// ── Configuration ───────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DB_URL;
if (!DATABASE_URL) {
  console.error("FATAL: DB_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 5 });
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = "127.0.0.1";
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 100;

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseQuery(urlStr) {
  const u = new URL(urlStr, `http://${HOST}`);
  const q = {};
  for (const [k, v] of u.searchParams) q[k] = v;
  return { pathname: u.pathname, query: q };
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function clampLimit(q) {
  const n = parseInt(q.limit, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_LIMIT) : DEFAULT_LIMIT;
}

function clampOffset(q) {
  const n = parseInt(q.offset, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// ── Handlers ────────────────────────────────────────────────────────────────

async function handleHealth(_req, res) {
  json(res, 200, { status: "ok" });
}

async function handleRoot(_req, res) {
  const { rows } = await pool.query(
    "SELECT relname AS name, n_live_tup AS count FROM pg_stat_user_tables ORDER BY relname"
  );
  json(res, 200, { tables: rows });
}

async function handleCurriculum(_req, res, query) {
  const limit = clampLimit(query);
  const offset = clampOffset(query);
  const conditions = [];
  const params = [];
  let idx = 1;

  if (query.grade) {
    conditions.push(`grade_key = $${idx++}`);
    params.push(query.grade);
  }
  if (query.subject) {
    conditions.push(`subject ILIKE '%' || $${idx++} || '%'`);
    params.push(query.subject);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `
    SELECT grade_key, grade, subject, category, seq_number,
           lesson_topic, skill_statement, standards, song_count,
           linked_songs, linked_resources, tags, circle_time_slot
      FROM curriculum_topics
      ${where}
      ORDER BY grade_key, seq_number
      LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  json(res, 200, rows);
}

async function handleSongs(_req, res, query) {
  const limit = clampLimit(query);
  const offset = clampOffset(query);
  const { rows } = await pool.query(
    `SELECT id, title, artist, type, age_range,
            educational_domain, verified, curriculum_links
       FROM songs ORDER BY id LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  json(res, 200, rows);
}

async function handleSongById(_req, res, id) {
  const songId = parseInt(id, 10);
  if (!Number.isFinite(songId) || songId <= 0) {
    return json(res, 400, { error: "Invalid song ID" });
  }

  const [songRes, sectionsRes, actionsRes, linksRes] = await Promise.all([
    pool.query("SELECT * FROM songs WHERE id = $1", [songId]),
    pool.query(
      "SELECT * FROM song_sections WHERE song_id = $1 ORDER BY sort_order",
      [songId]
    ),
    pool.query(
      "SELECT * FROM song_actions WHERE song_id = $1 ORDER BY action_sequence NULLS LAST",
      [songId]
    ),
    pool.query(
      "SELECT * FROM song_curriculum_links WHERE song_id = $1",
      [songId]
    ),
  ]);

  if (songRes.rows.length === 0) {
    return json(res, 404, { error: "Song not found" });
  }

  const song = songRes.rows[0];
  song.curriculum_links_text = song.curriculum_links;
  delete song.curriculum_links;
  song.sections = sectionsRes.rows;
  song.actions = actionsRes.rows;
  song.curriculum_links = linksRes.rows;
  json(res, 200, song);
}

async function handleActivities(_req, res, query) {
  const limit = clampLimit(query);
  const offset = clampOffset(query);
  const { rows } = await pool.query(
    `SELECT id, name, type, instructions, materials_needed,
            age_range, duration_minutes
       FROM activities ORDER BY id LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  json(res, 200, rows);
}

async function handleSearch(_req, res, query) {
  const q = query.q;
  if (!q) return json(res, 400, { error: "Missing required parameter: q" });

  const { rows } = await pool.query(
    `SELECT id, kind, source_path, url, title, chunk_text
       FROM search_chunks
      WHERE to_tsvector('english', chunk_text) @@ plainto_tsquery('english', $1)
         OR chunk_text ILIKE '%' || $1 || '%'
      ORDER BY
        CASE WHEN to_tsvector('english', chunk_text) @@ plainto_tsquery('english', $1)
             THEN ts_rank(to_tsvector('english', chunk_text), plainto_tsquery('english', $1))
             ELSE 0
        END DESC
      LIMIT 50`,
    [q]
  );
  json(res, 200, { query: q, results: rows });
}

// ── Router ──────────────────────────────────────────────────────────────────

const SONG_ID_RE = /^\/api\/songs\/(\d+)$/;

async function route(req, res) {
  const { pathname, query } = parseQuery(req.url);

  // Health
  if (pathname === "/health") return handleHealth(req, res);

  // Root: table listing
  if (pathname === "/") return handleRoot(req, res);

  // /api/curriculum
  if (pathname === "/api/curriculum") return handleCurriculum(req, res, query);

  // /api/songs/:id
  const songMatch = pathname.match(SONG_ID_RE);
  if (songMatch) return handleSongById(req, res, songMatch[1]);

  // /api/songs
  if (pathname === "/api/songs") return handleSongs(req, res, query);

  // /api/activities
  if (pathname === "/api/activities") return handleActivities(req, res, query);

  // /api/search
  if (pathname === "/api/search") return handleSearch(req, res, query);

  json(res, 404, { error: "Not found" });
}

// ── Server ──────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (err) {
    console.error("Request error:", err);
    if (!res.headersSent) json(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`curriculum-api listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  server.close();
  await pool.end();
  process.exit(0);
});
process.on("SIGINT", async () => {
  server.close();
  await pool.end();
  process.exit(0);
});
