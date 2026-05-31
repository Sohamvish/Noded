# Noded — Hypixel Skyblock Ironman Progression Tracker

**Noded** is a web application that helps Hypixel Skyblock **Ironman** players plan long-term progression. Users pin end-game goal items (for example Hyperion, Terminator, or a Slayer weapon), and the app builds an aggregated **shopping list** of every craft material required across all pinned goals by walking the game's recipe dependency graph. Progress is tracked against the player's own Skyblock profile after a one-time sync from the Hypixel API.

The app is **not** a leaderboard, macro, or automation tool. It is a read-only planning dashboard: browse items by skill and progression layer, inspect recipes, pin goals, and see what you still need to farm or craft.

### Which Hypixel API endpoints do you use?

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /v2/skyblock/profiles?uuid={uuid}` | Server-side only | Fetch the authenticated user's Skyblock profiles on manual sync. Extract member collections, skill XP, and inventory blobs for owned-item detection. |

We also call the **Mojang API** (`GET https://api.mojang.com/users/profiles/minecraft/{username}`) to resolve a Minecraft username to a UUID before querying Hypixel. This is not a Hypixel endpoint.

**We do not** call player status, guild, friends, recent games, or any non-Skyblock endpoints.

### How often will you call the Hypixel API?

- **Per-user cooldown:** 15 minutes minimum between syncs for the same account (enforced server-side).
- **Expected volume at launch:** Low. Each sync is one `GET /v2/skyblock/profiles` request per user action. We anticipate well under the default rate limit for a small personal/community tool.
- **No background polling:** The app never syncs automatically on a timer. Users must click "Sync now."
- **Caching:** After a successful sync, collections, skills, and completed item IDs are stored in our database (`user_profiles`). The dashboard reads cached data for KPI cards and shopping-list progress; Hypixel is only contacted again on the next manual sync.

### How is the API key stored and used?

- `HYPIXEL_API_KEY` is a **server-only** environment variable. It is never exposed to the browser, client bundles, or public repositories.
- All Hypixel requests originate from Next.js Route Handlers (`POST /api/hypixel/sync`) on the server after Supabase authentication.
- The API key is sent only in the `API-Key` request header, per Hypixel documentation.

### How do you respect player API settings?

Skyblock players control which data Hypixel returns via in-game **Settings → API** toggles (Inventory, Ender Chest, Wardrobe, etc.). Noded only reads whatever Hypixel includes in the profile response. If inventory data is disabled, sync still succeeds for collections and skills; the UI informs the user to enable inventory toggles for owned-item tracking.

### Data retention

Synced Hypixel data (collections, skills, completed item IDs, profile metadata) is stored per authenticated user in Supabase Postgres and used solely to power that user's dashboard. Users can sign out; data remains tied to their auth account. We do not sell or share Hypixel player data with third parties.

---

## Features

### Dashboard
- **Browse by skill** — Curated roadmap taxonomy (Early → Peak layers) plus inferred items by tier/category.
- **Item search** — Find any ingested item; open details or pin as a goal.
- **Pinned goals** — Up to three end-game targets; persisted per user (Supabase) or locally when signed out.
- **Shopping list** — Aggregated material requirements across all pinned goals, with optional enchanted-base expansion.
- **Progress tracking** — After sync, materials show owned/required counts and progress bars from cached collections and inventory.

### Profile sync
- Manual Hypixel sync from the sidebar **Profile Sync** view.
- Resolves Minecraft username → UUID (Mojang), then fetches Skyblock profiles (Hypixel).
- Deep sync optionally parses inventory NBT (prismarine-nbt) to detect owned items.

### Roadmap (in development)
- Interactive bubble-map visualization of progression milestones by skill (components exist; full view shipping next).

### Authentication
- Supabase Auth (OAuth / magic link). Row-level security on user-owned tables.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React 19 + Next.js App Router)                    │
│  Dashboard · Goals · Shopping list · Profile sync · Roadmap │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (same-origin API routes)
┌──────────────────────────▼──────────────────────────────────┐
│  Next.js server (Route Handlers)                            │
│  /api/hypixel/sync · /api/profile · /api/goals · /api/...   │
└──────┬─────────────────────────────┬────────────────────────┘
       │                             │
       ▼                             ▼
┌──────────────┐              ┌──────────────────┐
│ Hypixel API  │              │ Supabase Postgres │
│ (server key) │              │ items · recipes   │
└──────────────┘              │ user_profiles     │
                              └──────────────────┘
                                       ▲
                              ┌────────┴────────┐
                              │ NEU ingest      │
                              │ (offline script)│
                              └─────────────────┘
```

### Data sources
- **NotEnoughUpdates (NEU)** — Item metadata, recipes, and icons ingested offline via `npm run ingest` into Postgres. This is static game data, not live Hypixel data.
- **Hypixel Skyblock API** — Live player profile data on user-initiated sync only.
- **Curated roadmap** — Skill/layer milestones seeded via `npm run seed:roadmap`.

### Tech stack
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Zustand
- **Backend:** Next.js Route Handlers, Supabase (Auth + Postgres + RLS)
- **NBT parsing:** prismarine-nbt (inventory deep sync)

---

## Local development

### Prerequisites
- Node.js 20+
- A Supabase project (URL + anon key + service role for scripts)
- A Hypixel API key from [developer.hypixel.net](https://developer.hypixel.net/dashboard/)

### Setup

```bash
git clone <repository-url>
cd Hypixel_Skyblock_Ironman_Progression_Tracker_HSIPT
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase and Hypixel credentials
```

Apply database schema/migrations in Supabase, then ingest game data:

```bash
# Clone NEU repo path referenced by NEU_REPO_PATH in .env.local
npm run ingest
npm run seed:roadmap
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (webpack) |
| `npm run build` | Production build |
| `npm run ingest` | Ingest NEU item/recipe data into Supabase |
| `npm run seed:roadmap` | Seed curated skill/layer milestones |
| `npm run test:hypixel` | Run Hypixel inventory parser unit tests |

---

## Environment variables

See [`.env.local.example`](.env.local.example).

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server / scripts | Service role for ingestion scripts |
| `HYPIXEL_API_KEY` | **Server only** | Hypixel API key (`API-Key` header). See [Hypixel API keys](#hypixel-api-keys-development-vs-production) below. |
| `NEU_REPO_PATH` | Scripts | Path to NotEnoughUpdates data clone |

> **Never** commit `.env.local` or expose `HYPIXEL_API_KEY` to the client. Do not paste keys into the README, issues, or chat logs.

---

## Hypixel API keys (development vs production)

Hypixel provides different key types through the [Developer Portal](https://developer.hypixel.net/dashboard/):

| Key type | When to use | Lifetime |
|----------|-------------|----------|
| **Temporary (development)** | Building and testing before a 1.0 release | Short-lived — regenerate every ~48–72 hours (Hypixel may vary; treat it as every couple of days during active dev) |
| **Production** | After 1.0 release, for deployed app | Non-expiring — apply via the portal using this project's README description |
| **In-game (`/api new`)** | Quick local testing only | Expires after ~72 hours |

### Development workflow (current)

1. Create or regenerate a **Temporary API key** in the developer dashboard.
2. Paste it into `.env.local` as `HYPIXEL_API_KEY="..."` (this file is gitignored).
3. **Restart the dev server** (`npm run dev`) so Next.js reloads env vars.
4. When sync fails with `Invalid API key`, regenerate the temp key and update `.env.local`.

### Production workflow (after 1.0)

1. Ship version 1.0.
2. Submit a **Production API key** application (use the [application description](#application-description-for-hypixel-api-production-key-review) section above).
3. Replace `HYPIXEL_API_KEY` in your hosting provider's environment (Vercel, etc.) — still never in the repo.

---

## Hypixel API integration details

### Sync flow (`POST /api/hypixel/sync`)
1. Require authenticated Supabase user.
2. Enforce 15-minute per-user cooldown (`last_api_sync_at`).
3. Resolve `minecraftUsername` via Mojang API.
4. Call `GET https://api.hypixel.net/v2/skyblock/profiles?uuid={uuid}` with server `API-Key` header.
5. Select the player's active Skyblock profile (or specified `profileId`).
6. Extract member `collection`, `player_data.experience` (skills), and optionally inventory NBT.
7. Upsert cached data into `user_profiles`.

### Error handling
- Invalid or expired API keys return a clear server error (403 from Hypixel → user-facing message to update `HYPIXEL_API_KEY`).
- Rate limit (429) and missing player (404) are handled with appropriate HTTP status codes.

---

## Privacy & security

- Hypixel API key is server-side only.
- User profile cache is scoped by Supabase Auth user ID with row-level security.
- Sync requires authentication; anonymous users can browse items and pin goals locally only.
- No Hypixel requests are made on behalf of users other than the signed-in account syncing their own linked username.

---

## Roadmap

- [ ] Interactive roadmap bubble map (skill/layer visualization)
- [ ] Wire KPI cards to live sync stats (partially complete)
- [ ] Community strategy guides (`strategies` table)
- [ ] Production deployment with permanent Hypixel production API key (apply after 1.0)

---

## License

Private project — all rights reserved unless otherwise noted. Hypixel is a trademark of Hypixel Inc. Skyblock and related game content belong to their respective owners. NotEnoughUpdates data is used for item/recipe reference under its repository terms.
