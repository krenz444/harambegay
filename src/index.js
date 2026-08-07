/**
 * harambe.gay — static shrine + a guestbook that actually remembers.
 *
 * Everything except /api/* is handed to the static assets binding.
 */

const MAX_NAME = 30;
const MAX_MSG = 280;
const PAGE_SIZE = 40;

/* one signature per IP per minute, 8 per hour — enough for a shrine, annoying for a bot */
const RATE_WINDOW_S = 60;
const RATE_HOUR_S = 3600;
const RATE_PER_HOUR = 8;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** Salted so the table never holds a reversible visitor address. */
async function hashIP(ip, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* Strip control characters and collapse the runaway newlines people paste in. */
function clean(value, max) {
  let out = '';
  for (const ch of String(value ?? '')) {
    const code = ch.codePointAt(0);
    const isControl = code < 32 || code === 127;
    if (isControl && ch !== '\n') continue;
    out += ch;
  }
  return out
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

async function listEntries(env) {
  const { results } = await env.GUESTBOOK.prepare(
    `SELECT name, msg, created_at FROM entries
     WHERE hidden = 0
     ORDER BY created_at DESC, id DESC
     LIMIT ?`
  )
    .bind(PAGE_SIZE)
    .all();

  /* oldest-first so the page renders the shrine's history in order */
  return results.reverse().map((r) => ({ n: r.name, m: r.msg, t: r.created_at }));
}

async function sign(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'malformed' }, 400);
  }

  const name = clean(body.n, MAX_NAME);
  const msg = clean(body.m, MAX_MSG);
  if (!name || !msg) return json({ error: 'need a name and a message' }, 400);

  /* Honeypot: the real form leaves this empty, naive bots fill every field. */
  if (clean(body.website, 20)) return json({ ok: true, skipped: true });

  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ipHash = await hashIP(ip, env.IP_SALT || 'harambe');
  const now = Math.floor(Date.now() / 1000);

  const recent = await env.GUESTBOOK.prepare(
    `SELECT
       COUNT(*) AS hour,
       COALESCE(SUM(created_at > ?), 0) AS minute
     FROM entries
     WHERE ip_hash = ? AND created_at > ?`
  )
    .bind(now - RATE_WINDOW_S, ipHash, now - RATE_HOUR_S)
    .first();

  if (recent && recent.minute > 0) {
    return json({ error: 'slow down. he waited 10 years, u can wait a minute.' }, 429);
  }
  if (recent && recent.hour >= RATE_PER_HOUR) {
    return json({ error: 'u have said enough for one hour. he heard u.' }, 429);
  }

  await env.GUESTBOOK.prepare(
    `INSERT INTO entries (name, msg, created_at, ip_hash) VALUES (?, ?, ?, ?)`
  )
    .bind(name, msg, now, ipHash)
    .run();

  return json({ ok: true, entry: { n: name, m: msg, t: now } });
}

/**
 * The hit counter. Seeded from Cloudflare's own pageView analytics so the number
 * on the page is a continuation of reality, not a fresh zero.
 * POST bumps it (the page calls that once per browser session), GET just reads.
 */
async function hits(request, env) {
  if (request.method === 'POST') {
    await env.GUESTBOOK.prepare(
      `INSERT INTO counters (name, n) VALUES ('hits', 1)
       ON CONFLICT(name) DO UPDATE SET n = n + 1`
    ).run();
  }
  const row = await env.GUESTBOOK.prepare(`SELECT n FROM counters WHERE name = 'hits'`).first();
  return json({ hits: (row && row.n) || 0 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/hits') {
      try {
        return await hits(request, env);
      } catch {
        /* the shrine does not care how many people saw it */
        return json({ hits: null }, 200);
      }
    }

    if (url.pathname === '/api/guestbook') {
      try {
        if (request.method === 'GET') return json({ entries: await listEntries(env) });
        if (request.method === 'POST') return await sign(request, env);
        return json({ error: 'method not allowed' }, 405);
      } catch (err) {
        /* the shrine stays up even when the guestbook does not */
        return json({ error: 'the guestbook is having feelings. try again.' }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
