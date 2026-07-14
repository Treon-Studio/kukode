# AGENTS.md — Kukode

**Kukode** is a premium Astro directory & showcase platform for modern web developer submissions and curated lists. Users can register accounts (email/passkey/Google), submit products, vote (upvote), write comments, and view curated sites. Built as a server-rendered Astro app deployed on **Cloudflare Workers**, backed by **Turso (libSQL)** for data and **Drizzle ORM** for queries.


## Tech stack

| Area | Details |
|------|---------|
| **Framework** | [Astro](https://astro.build/) `^6.3.6` — `output: 'server'`, deployed via `@astrojs/cloudflare` (`imageService: 'passthrough'`) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) `^4.1.18` via `@tailwindcss/vite` |
| **Markdown / MDX** | `@astrojs/mdx` `^5.0.0`; content collections in `src/content.config.ts` |
| **Astro integrations** | `@astrojs/sitemap` `^3.7.1`, `@astrojs/rss` `^4.0.17` |
| **Tailwind plugins** | `@tailwindcss/forms`, `@tailwindcss/typography`, `tailwind-scrollbar-hide` |
| **Database** | Turso (libSQL) via `@libsql/client`; ORM = `drizzle-orm` `^0.45`; migrations via `drizzle-kit` |
| **Runtime effects** | `effect` `^3.21` (typed service layer) |
| **Auth** | Email/password sessions + WebAuthn passkeys (`@simplewebauthn/server`, `webauthn-polyfills`) + Google OAuth |
| **Cache / rate limit** | `@upstash/redis` + `@upstash/ratelimit` |
| **Mail / payments / chat** | Resend (transactional), Xendit (IDR invoices), Discord (webhooks/notifications) |
| **Lint / format** | **Biome** (`@biomejs/biome` `^2.4`) — single quotes, 2-space, `lineWidth: 100`, semicolons, ES5 trailing commas. No Prettier/ESLint. |
| **Tests** | **Vitest** (`src/**/*.test.ts`, `environment: 'node'`, `globals: true`) |
| **Lexington** | `@lexingtonthemes/seo` `^0.1.0` (e.g. `AstroSeo` in `src/components/fundations/head/Seo.astro`) |
| **Aliases** | `@/*` → `src/*` (`tsconfig.json`) |
| **Patch mgmt** | `patch-package` (run automatically on `postinstall`; patches live in `patches/`) |

**Config:** `astro.config.mjs` — `site: 'https://kukode.treonstudio.com'`, `markdown.drafts: true` + a duplicate top-level `shikiConfig` (`theme: 'min-light'`, `wrap: true`, `skipInline: false`, `drafts: true`). The `@astrojs/cloudflare` adapter is disabled when `dev` is in `process.argv` (i.e. only used for `build`/`preview`).

## Folder map

| Path | Role |
|------|------|
| `src/pages/` | File-based routes (see Routing below) |
| `src/layouts/` | `BaseLayout`, `BlogLayout`, `LegalLayout`, `StoreLayout`, `SitesLayout`, `DashboardLayout`, `AdminLayout` |
| `src/components/` | UI: `fundations/` (design system: containers, elements, head, icons, scripts), `navigation/`, `global/`, `landing/`, `blog/`, `assets/` |
| `src/content/` | Markdown **sources** for collections (`legal/`, `store/`, `sites/`, `posts/`) — not the Astro `content.config` file (that lives in `src/content.config.ts`) |
| `src/styles/` | `global.css` — Tailwind import, `@theme` tokens, plugins |
| `src/images/` | Images referenced from content `image()` fields and components (e.g. `blog/`, `sites/`, `store/`, `lex.jpg`) |
| `src/db/` | Drizzle schema (`schema.ts`), client (`index.ts`), migrations runner (`migrate.ts`), seed (`seed.ts`) |
| `src/domain/` | Domain modules grouped by capability — `admin`, `analytics`, `auth`, `comments`, `cron`, `newsletter`, `site`, `store`, `webhook`. Pure business logic; should not import from `infra/`. |
| `src/infra/` | Adapters to external services — `cache/`, `db/` (`drizzle.client.ts`), `discord/`, `mail/`, `payment/` (Xendit), `runtime/` (`app.runtime.ts` for the Cloudflare env). |
| `src/lib/` | Cross-cutting helpers — `constants.ts`, `discord.ts`, `email.ts`, `flags.ts` (feature flags), `ratelimit.ts` (Upstash), `storage/` (state-machine + adapters) |
| `src/shared/` | Cross-layer utilities: `errors/`, `types/` |
| `src/i18n/` | `translations.ts` (en/id strings), `utils.ts` |
| `src/middleware.ts` | Session lookup + auth/route gating (see Middleware below) |
| `src/env.d.ts` | Declares `App.Locals` shape (`runtime`, `user`, `profile`) |
| `public/` | **Present.** Static assets: favicons (ico + 16/32/48 + apple-touch), `icon.svg`, `manifest.webmanifest`, `og-image.jpg`, `robots.txt` |
| `drizzle/` | Generated SQL migration files (`drizzle-kit generate` writes here) |
| `wrangler.toml` | Cloudflare Workers binding (`name = "kukode"`, `compatibility_date = "2024-04-05"`) — secrets via `wrangler secret put` |
| `docs/` | Internal long-form docs — `docs/prd.md` (34 KB), `docs/coding-standards.md` (210 KB) |
| `tasks/` | Older planning — `tasks/prd-kukode.md` |
| `local.db` | Local libSQL SQLite file for dev when `TURSO_DATABASE_URL` is unset (`drizzle.config.ts` falls back to `file:local.db`). Gitignored. |

## Content collections (`src/content.config.ts`)

IDs are the filename without `.md`/`.mdx` (`generateId` strips extension). Use paths under `src/images/` for `image()` fields (see existing entries).

### `legal`

| | |
|--|--|
| **Folder** | `src/content/legal/` |
| **Schema** | `page` (string), `pubDate` (date) |
| **Images** | None in schema |
| **Template** | Copy structure from `src/content/legal/terms.md` or `privacy.md` |

### `store`

| | |
|--|--|
| **Folder** | `src/content/store/` |
| **Schema** | `price`, `title`, `preview`, `checkout`, `license`, `highlights` (string[]), `description`, `features` (`{ title, description }[]`), `image: { url: image(), alt }`, optional `gallery: { url: image(), alt }[]` |
| **Images** | `image()` — local assets (e.g. `/src/images/store/...`) |
| **Template** | `src/content/store/1.md` |

### `sites`

| | |
|--|--|
| **Folder** | `src/content/sites/` |
| **Schema** | `live`, `title`, `tagline`, `description`, optional `isNew`, optional `details: { label, value }[]`, `thumbnail: { url: image(), alt }`, optional `tags` (array, items optional in Zod) |
| **Images** | `thumbnail.url` via `image()` |
| **Template** | `src/content/sites/1.md` |

### `posts` (blog)

| | |
|--|--|
| **Folder** | `src/content/posts/` |
| **Schema** | `title`, `pubDate`, `description`, `image: { url: image(), alt }`, `tags: string[]` |
| **Images** | `image.url` via `image()` (e.g. `/src/images/blog/...`) |
| **Template** | `src/content/posts/1.md` |

**Do not** widen Zod fields without updating every page/layout that reads `entry.data` (e.g. `BlogLayout`, `StoreLayout`, cards).

## Routing conventions

| URL pattern | Source |
|-------------|--------|
| `/` | `src/pages/index.astro` — landing + `showSearch={true}` |
| `/blog/`, `/blog/posts/[slug]/`, `/blog/tags/`, `/blog/tags/[tag]/` | Posts collection listing, detail, tags |
| `/store/`, `/store/[slug]` | Store grid + product detail (`trailingSlash: false`) |
| `/sites/site/[slug]`, `/sites/tags/`, `/sites/tags/[tag]/` | Curated sites listing + detail + tags |
| `/legal/[slug]` | Legal pages (`trailingSlash: false`) |
| `/rss.xml` | `src/pages/rss.xml.js` — **note:** uses `import.meta.glob('./blog/*.{md,mdx}')` under `src/pages/`; there is no such markdown tree next to that file (blog bodies live in `src/content/posts/`). Adjust if you need a working feed from collections. |
| `/system/*` | Styleguide (`overview`, `colors`, `typography`, `buttons`, `links`) |
| `/dashboard/*` | Authenticated user area (analytics, products, settings) — gated by middleware |
| `/admin/*` | Admin-only (analytics, flags, products, reports) — gated by middleware (`profile.role === 'admin'`) |
| `/leaderboard` | Cross-user ranking page |
| `/api/*` | JSON endpoints under `src/pages/api/` — `admin/`, `advertise/`, `auth/` (signin/signup/passkey/Google), `comments/`, `cron/`, `events/`, `newsletter/`, `sites/` (submit/vote/comment), `store/`, `webhooks/` (e.g. Xendit) |
| Other single pages | `pricing`, `about`, `advertise`, `submit`, `signup`, `signin`, `404` |

**Changelog:** not present as a collection or route in this repo.

## Customization

- **Site URL / domain:** `site` in `astro.config.mjs` (currently `https://kukode.treonstudio.com`). Align with placeholders in `src/components/fundations/head/Seo.astro` and any canonical/OG URLs.
- **Brand colors / typography:** `src/styles/global.css` — `@theme` (`--font-sans`, `--font-display`, `--color-accent-*`, `--color-base-*`). Optional fine-tuning: `src/pages/system/colors.astro`, `typography.astro`.
- **Navigation / footer:** `src/components/navigation/Navigation.astro`, `MobileNav.astro`, `src/components/global/Footer.astro`.
- **Global shell / head:** `src/layouts/BaseLayout.astro` (nav, search, footer toggles); `src/components/fundations/head/BaseHead.astro` (pulls `Seo`, `Meta`, `Fonts`, `Favicons`, `FuseJS`).

## Environment variables

`.env.example` is the source of truth for local dev keys. Mirrored to `.dev.vars` for `wrangler`. See `wrangler.toml` — Cloudflare secrets should be set with `npx wrangler secret put`.

| Key | Used for |
|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Drizzle/libSQL client (`src/db/index.ts`) — falls back to `file:local.db` in dev |
| `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase client |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting + cache via `@upstash/ratelimit` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `RESEND_API_KEY` | Transactional email (Sprint 3) |
| `XENDIT_SECRET_KEY`, `XENDIT_CALLBACK_TOKEN` | IDR invoicing (Sprint 4) — webhooks under `/api/webhooks/` |
| `FEATURE_AUTO_APPROVE`, `FEATURE_SPONSORED_LISTING` | Optional env override of DB feature flags (`src/lib/flags.ts`) |

`src/db/index.ts` deliberately swaps `file:` URLs for a dummy `libsql://dummy.turso.io` during the production build step (because the Workers web driver cannot open local files).

## Middleware (`src/middleware.ts`)

Runs on every server-rendered request, in this order:

1. **Language detection** — `?lang=en|id` query param wins, otherwise the `preferred_lang` cookie, otherwise `en`. Result is written to `Astro.locals.lang` and synced back to the DB on the next request for logged-in users.
2. **Session lookup** — reads `AUTH_CONFIG.COOKIE_SESSION_NAME`, joins `sessions` ↔ `profiles` in Turso, and writes `Astro.locals.user` (id, email) and `Astro.locals.profile` (id, username, full_name, avatar_url, role). Expired sessions are deleted in-place.
3. **Rate limiting** — intercepts POSTs to `/api/auth/signup`, `/api/auth/signin`, `/api/sites/submit`, `/api/sites/comment`, `/api/sites/vote`. Auth uses the IP; authenticated actions use `user_<id>`. Failed limits redirect (auth/submit/comment) or return JSON 429 with `X-RateLimit-*` headers (vote).
4. **Route gating** — `/dashboard/*` requires any authenticated user; `/admin/*` additionally requires `profile.role === 'admin'` (otherwise 302 → `/404`). Logged-in users hitting `/signin` or `/signup` are redirected to `/dashboard`.

## Architecture layers

This is a port-flavored DDD layout. When adding a feature, place code in the deepest layer that fits without depending on layers above it:

- `src/domain/<capability>/` — pure business logic. Knows about the `db` client and schemas but **not** about Astro, fetch, mailers, or external SDKs. Examples: `auth/`, `comments/`, `site/`, `store/`, `newsletter/`, `cron/`, `webhook/`, `analytics/`, `admin/`.
- `src/infra/` — adapters wrapping external SDKs. `cache/`, `db/drizzle.client.ts`, `discord/`, `mail/` (Resend), `payment/` (Xendit), `runtime/app.runtime.ts`.
- `src/lib/` — app-wide helpers. `flags.ts` (feature flag resolver), `ratelimit.ts` (Upstash), `storage/` (state-machine + pluggable adapters), `discord.ts`, `email.ts`, `constants.ts`.
- `src/shared/` — `errors/`, `types/` — no domain concepts, safe to import from anywhere.
- `src/pages/api/` — thin handlers: validate input → call a `domain/*` function → respond. Use `Astro.locals.user`/`profile` for auth.

## Feature flags

Driven by the `feature_flags` table (`src/db/schema.ts`) with optional env overrides from `.env`/`FEATURE_*`. Resolution lives in `src/lib/flags.ts`. Admin can toggle flags under `/admin/flags`.

## i18n

Five locales are wired end-to-end (URL `?lang=…` → middleware → `Astro.locals.lang` → `useTranslations()`):

| Code | Name (native) | Notes |
|---|---|---|
| `en` | English | `defaultLang` |
| `id` | Bahasa Indonesia | Production-grade |
| `bjn` | Bahasa Banjar | **Approximate** — needs native-speaker review |
| `jv` | Basa Jawa | **Approximate** — needs native-speaker review |
| `ms` | Bahasa Melayu | **Approximate** — needs native-speaker review |

All strings live in `src/i18n/translations.ts`. The full accepted-code list is exported as `supportedLangCodes` and used by `src/middleware.ts` for validation. **Never** hardcode `lang === 'en' || lang === 'id'` — middleware accepts any of the 5 codes, and ternaries must be replaced with `t('key')` lookups.

- Add a string: append it to **all 5** `ui.<lang>` dictionaries (or accept English fallback via `useTranslations`).
- Use server-side: `const t = useTranslations(getLangFromLocals(Astro.locals)); t('nav.signin')`.
- Use client-side: render a `<script type="application/json" id="…-i18n-dict" set:html={JSON.stringify(getClientDict(lang))} />` next to the bundled `<script>`, then read `JSON.parse(document.getElementById('…').textContent)` inside. See `src/pages/dashboard/settings.astro` for the canonical pattern, and `src/components/global/GlobalInteractions.astro` for the inline-script variant.
- Add a new language: extend `languages`, `supportedLangCodes`, and add a full `ui.<code>` entry. Update `src/components/navigation/Navigation.astro` and `MobileNav.astro` switchers, and `src/db/schema.ts` (the `preferred_lang` column has no constraint, but update the inline comment).

## Auth model

- Email + password — hashed, stored in `profiles.password_hash`.
- Sessions — server-side rows in `sessions` table; cookie holds only the session id; expires on `expires_at`.
- Passkeys — WebAuthn via `@simplewebauthn/server`; credentials persisted in `passkeys`.
- Google OAuth — server-side flow.
- Roles — `profiles.role` is `'user' | 'maker' | 'admin'`.

## Commands

From `package.json` (run at repo root):

| Command | Action |
|---|---|
| `npm install` | Install dependencies (runs `patch-package` via `postinstall`) |
| `npm run dev` / `npm start` | Start Astro dev server (Cloudflare adapter is **off** in dev) |
| `npm run build` | Production build to `./dist/` (Cloudflare adapter active) |
| `npm run preview` | Preview production build locally |
| `npm run astro ...` | Astro CLI passthrough |
| `npm run lint` | `biome check .` |
| `npm run lint:fix` | `biome check --write .` |
| `npm run format` | `biome format --write .` |
| `npm test` | `vitest run` (one-shot) |
| `npm run test:watch` | `vitest` watch mode |
| `npm run db:generate` | `drizzle-kit generate` — emit SQL into `./drizzle/` from `src/db/schema.ts` |
| `npm run db:migrate` | `tsx src/db/migrate.ts` — apply migrations to the configured DB |
| `npm run db:push` | `drizzle-kit push` — push schema directly without migration files |
| `npm run db:seed` | `tsx src/db/seed.ts` — seed dev data |

`vitest.config.ts` picks up only `src/**/*.test.ts` under the `node` environment. `tsconfig.json` paths are honored via `vite-tsconfig-paths`.  

## Guardrails

- Keep the folder name **`fundations`** as spelled in this repo (do not "fix" to *foundations* without a coordinated rename everywhere).
- Do not expand content schemas lightly; update all consumers (layouts, cards, `getStaticPaths`) in the same change.
- Prefer small diffs and existing patterns (`@/` imports, collection names `posts` | `sites` | `store` | `legal`).
- **Layering:** `src/domain/*` must not import from `src/infra/*`, `src/lib/*`, `src/pages/*`, or Astro. Page/API handlers live in `src/pages/api/` and should stay thin.
- **DB at build time:** `astro build` does **not** have access to Turso credentials by default — `src/db/index.ts` swaps `file:` URLs for a dummy libSQL host during build. Do not rely on DB calls during `getStaticPaths`.
- **Mutating content collections (`src/content/*`)** is out-of-band: those folders are content sources, not schema definitions. The actual schemas are in `src/content.config.ts`.
- **Cloudflare Workers constraints** — avoid Node-only APIs (`fs`, `crypto` modules), `Buffer`, and long-running connections. Use `crypto.randomUUID()` and the Web Crypto API.
- **Secrets:** never commit real keys. Use `.env` for local dev (gitignored) and `wrangler secret put` for production. `.env.example` is the template.
- **Lint/format is Biome** — do not introduce Prettier, ESLint, or husky/lint-staged configs unless asked. Single quotes, 2-space indent, semicolons, ES5 trailing commas, 100-col width.
- **Before changing sensitive areas** (auth, middleware, payments, schema, rate limits), read:
  - `docs/prd.md` — current product requirements
  - `docs/coding-standards.md` — coding rules (long)
  - `src/middleware.ts` and `src/lib/constants.ts` (`AUTH_CONFIG`)
  - The relevant `src/domain/<capability>/` module

## Lexington links (from README)

- Theme specs: https://lexingtonthemes.com/templates/carbon  
- Documentation: https://lexingtonthemes.com/documentation  
- Changelog (theme): https://lexingtonthemes.com/changelog/carbon  
- Support: https://lexingtonthemes.com/legal/support/  
- Bundle: https://lexingtonthemes.com  
