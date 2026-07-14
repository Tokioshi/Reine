# Reine Workers

Cloudflare Workers native Discord Interactions bot. No Express, no app.listen, no persistent server, no node-cron, no local filesystem database, no process.env in Worker code.

## Setup

```bash
npm install
npm run db:create
```

Copy the generated D1 database id into `wrangler.jsonc` under `d1_databases[0].database_id`.

Apply schema:

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

Set secrets:

```bash
npx wrangler secret put BOT_TOKEN
npx wrangler secret put APPLICATION_ID
npx wrangler secret put PUBLIC_KEY
npx wrangler secret put GUILD_ID
npx wrangler secret put NOTIFY_CHANNEL_ID
npx wrangler secret put REGISTER_SECRET
npx wrangler secret put ANILIST_PROXY_TOKEN
npx wrangler secret put ANILIST_PROXY_URL
```

Deploy:

```bash
npm run deploy
```

Set Discord Interactions Endpoint URL:

```text
https://<your-worker>.<your-subdomain>.workers.dev/interactions
```

Register guild slash commands after deploy:

```bash
curl -X POST \
  -H "Authorization: Bearer <REGISTER_SECRET>" \
  https://<your-worker>.<your-subdomain>.workers.dev/admin/register-commands
```

Scheduled episode checks are configured in `wrangler.jsonc` with cron `*/10 * * * *` and handled by `scheduled()` in `src/index.js`.
