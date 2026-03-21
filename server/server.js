const express = require('express');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.INVADER_DB_PATH || path.join(__dirname, 'data', 'invader_rankings.db');
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*').trim();
const RATE_LIMIT_MS = Number(process.env.RATE_LIMIT_MS || 2500);
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL UNIQUE,
    score INTEGER NOT NULL,
    wave INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_scores_order ON scores(score DESC, wave DESC, updated_at ASC);
`);

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '32kb' }));

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

app.use((req, res, next) => {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

function normalizeName(raw) {
  const cleaned = String(raw || '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 12);
  return cleaned || 'PLAYER-0000';
}

function nameKey(name) {
  return normalizeName(name).toLowerCase();
}

function toSafeInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.floor(num));
}

function clampLimit(value) {
  const limit = toSafeInt(value, DEFAULT_LIMIT);
  return Math.max(1, Math.min(MAX_LIMIT, limit || DEFAULT_LIMIT));
}

function getLeaderboard(limit = DEFAULT_LIMIT) {
  const stmt = db.prepare(`
    SELECT name, score, wave, updated_at
    FROM scores
    ORDER BY score DESC, wave DESC, updated_at ASC
    LIMIT ?
  `);
  return stmt.all(limit).map((row, index) => ({
    rank: index + 1,
    name: row.name,
    score: row.score,
    wave: row.wave,
    updatedAt: row.updated_at
  }));
}

const findByKeyStmt = db.prepare('SELECT * FROM scores WHERE name_key = ?');
const insertStmt = db.prepare(`
  INSERT INTO scores (name, name_key, score, wave, updated_at, created_at)
  VALUES (@name, @name_key, @score, @wave, @updated_at, @created_at)
`);
const updateBestStmt = db.prepare(`
  UPDATE scores
  SET name = @name, score = @score, wave = @wave, updated_at = @updated_at
  WHERE name_key = @name_key
`);
const updateNameOnlyStmt = db.prepare(`
  UPDATE scores
  SET name = @name
  WHERE name_key = @name_key
`);
const rankStmt = db.prepare(`
  SELECT COUNT(*) AS better_count
  FROM scores
  WHERE score > @score
     OR (score = @score AND wave > @wave)
     OR (score = @score AND wave = @wave AND updated_at < @updated_at)
`);

const recentByIp = new Map();
function hitRateLimit(ip) {
  const now = Date.now();
  const prev = recentByIp.get(ip) || 0;
  if (now - prev < RATE_LIMIT_MS) return true;
  recentByIp.set(ip, now);
  return false;
}

app.get('/api/invader/health', (req, res) => {
  res.json({ ok: true, service: 'invader-ranking', dbPath: DB_PATH });
});

app.get('/api/invader/leaderboard', (req, res) => {
  const limit = clampLimit(req.query.limit);
  const items = getLeaderboard(limit);
  res.json({ ok: true, items, limit });
});

app.post('/api/invader/score', (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  if (hitRateLimit(ip)) {
    return res.status(429).json({ ok: false, message: '送信が早すぎます。少し待ってから再送してください。' });
  }

  const safeName = normalizeName(req.body?.name);
  const safeScore = Math.min(toSafeInt(req.body?.score, 0), 999999999);
  const safeWave = Math.min(Math.max(toSafeInt(req.body?.wave, 1), 1), 999999);

  if (safeScore <= 0) {
    return res.status(400).json({ ok: false, message: 'score が 0 以下です。' });
  }

  const key = nameKey(safeName);
  const existing = findByKeyStmt.get(key);
  const now = new Date().toISOString();

  let bestRow;
  let improved = false;

  if (!existing) {
    insertStmt.run({
      name: safeName,
      name_key: key,
      score: safeScore,
      wave: safeWave,
      updated_at: now,
      created_at: now
    });
    bestRow = { name: safeName, name_key: key, score: safeScore, wave: safeWave, updated_at: now };
    improved = true;
  } else {
    const shouldUpdateBest = safeScore > existing.score || (safeScore === existing.score && safeWave > existing.wave);
    if (shouldUpdateBest) {
      updateBestStmt.run({
        name: safeName,
        name_key: key,
        score: safeScore,
        wave: safeWave,
        updated_at: now
      });
      bestRow = { ...existing, name: safeName, score: safeScore, wave: safeWave, updated_at: now };
      improved = true;
    } else {
      if (existing.name !== safeName) {
        updateNameOnlyStmt.run({ name: safeName, name_key: key });
      }
      bestRow = {
        ...existing,
        name: safeName,
        score: existing.score,
        wave: existing.wave,
        updated_at: existing.updated_at
      };
    }
  }

  const rank = rankStmt.get({
    score: bestRow.score,
    wave: bestRow.wave,
    updated_at: bestRow.updated_at
  }).better_count + 1;

  res.json({
    ok: true,
    improved,
    rank,
    best: {
      name: bestRow.name,
      score: bestRow.score,
      wave: bestRow.wave,
      updatedAt: bestRow.updated_at
    },
    items: getLeaderboard(clampLimit(req.query.limit || DEFAULT_LIMIT))
  });
});

app.listen(PORT, () => {
  console.log(`Invader ranking server running on :${PORT}`);
  console.log(`DB: ${DB_PATH}`);
});
