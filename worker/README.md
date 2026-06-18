# Admin publish Worker

Cloudflare Worker that backs the dev-log poster on `/admin`. The admin page
POSTs a log entry to `/admin/api/publish`; this Worker commits it to
`data/dev-logs.json` via the GitHub API.

The site itself is static (GitHub Pages); this Worker is the only server-side
piece. The GitHub write token lives here as a Worker **secret** — never in the
public site source.

## Deploy

From this `worker/` directory:

```bash
# 1. Install the Cloudflare CLI (one-time)
npm install -g wrangler

# 2. Log in to Cloudflare
wrangler login

# 3. Store the GitHub token as a secret (paste when prompted)
wrangler secret put GITHUB_TOKEN

# 4. Deploy
wrangler deploy
```

## The GITHUB_TOKEN

Create a **fine-grained PAT** scoped to `ProtOSdotDEV/protos-systems-site` with:

- **Contents: Read and write** (to update `data/dev-logs.json`)

That is the only permission required. Set an expiry and rotate it periodically.
