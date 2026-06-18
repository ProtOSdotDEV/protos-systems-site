// Cloudflare Worker — admin dev-log publisher.
//
// Routed on protos-systems.dev/admin/api/* (see wrangler.toml), so it runs at
// Cloudflare's edge and is covered by the same Zero Trust policy as /admin/*.
// The admin page POSTs a log entry here; this Worker commits it to
// data/dev-logs.json via the GitHub API using GITHUB_TOKEN (a Worker secret,
// never present in the public site source).

const OWNER = 'ProtOSdotDEV';
const REPO = 'protos-systems-site';
const BRANCH = 'main';
const LOGS_PATH = 'data/dev-logs.json';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    let entry;
    try {
      entry = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const project = (entry.project || '').trim();
    const date = (entry.date || '').trim();
    const title = (entry.title || '').trim();
    const body = (entry.body || '').trim();
    if (!project || !date || !title || !body) {
      return json({ error: 'Missing required fields' }, 400);
    }

    const gh = (path, init = {}) =>
      fetch(`https://api.github.com/repos/${OWNER}/${REPO}/${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'protos-admin-publisher',
          ...(init.headers || {}),
        },
      });

    // Read the current logs file (need its sha to update it).
    const getRes = await gh(`contents/${LOGS_PATH}?ref=${BRANCH}`);
    if (!getRes.ok) {
      return json({ error: 'Could not read dev-logs.json' }, 502);
    }
    const file = await getRes.json();

    let data;
    try {
      data = JSON.parse(decodeBase64(file.content));
    } catch {
      return json({ error: 'dev-logs.json is not valid JSON' }, 502);
    }
    data.logs = Array.isArray(data.logs) ? data.logs : [];
    data.logs.unshift({ project, date, title, body });

    // Commit the updated file.
    const putRes = await gh(`contents/${LOGS_PATH}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Add dev log: ${title}`,
        content: encodeBase64(JSON.stringify(data, null, 2) + '\n'),
        sha: file.sha,
        branch: BRANCH,
      }),
    });
    if (!putRes.ok) {
      return json({ error: 'Failed to commit log entry' }, 502);
    }

    return json({ ok: true });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// UTF-8 safe base64 helpers (GitHub returns/expects base64 content).
function decodeBase64(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
