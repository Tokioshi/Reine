# Reine Workers

Cloudflare Workers native Discord Interactions bot. No Express, no app.listen, no persistent server, no node-cron, no local filesystem database, no process.env in Worker code.

## Project structure

```text
commands/   Slash command implementations
events/     Cloudflare Worker fetch and scheduled events
handler/    Discord interaction dispatch and command registration
utils/      Shared Discord, AniList, database, and response helpers
schema/     D1 database migrations
index.js    Cloudflare Worker entry point
```

Cloudflare Workers receive Discord interactions through HTTP rather than a persistent WebSocket connection. `events/fetch.js` routes incoming HTTP requests, while `handler/interactions.js` verifies and dispatches Discord interactions to files in `commands/`.

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
npx wrangler secret put TICKET_LOG_CHANNEL_ID
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

Scheduled episode checks are configured in `wrangler.jsonc` with cron `*/10 * * * *`. The Worker entry point forwards that event to `events/scheduled.js`.

## Private-thread tickets

Run `/ticket-panel` as an administrator in the text channel that should host ticket threads. The panel channel becomes the parent for every ticket opened from that panel.

Apply the ticket migration before deploying:

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

Set `TICKET_LOG_CHANNEL_ID` to the channel that should receive close summaries. The roles invited into every private ticket are configured in `wrangler.jsonc` under `TICKET_ROLE_IDS`.

Recommended permissions on the panel channel:

- Members: `View Channel` and `Send Messages in Threads`; deny creating public/private threads manually.
- Configured ticket roles: `View Channel`, `Send Messages in Threads`, `Read Message History`, and `Manage Threads`.
- Bot: `View Channel`, `Create Private Threads`, `Send Messages in Threads`, `Read Message History`, `Manage Threads`, `Manage Messages`, and permission to mention the configured roles.

The ticket owner is added directly through Discord's thread-member endpoint. Configured roles are invited by a temporary role-mention message that is deleted immediately. Closing a ticket removes the owner, then locks and archives the thread instead of deleting its history.
