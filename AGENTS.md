# AGENTS.md — Carbon (Lexington Themes)

**Carbon** is a Lexington Themes Astro template for a **directory / showcase-style marketing site**: homepage highlights featured “sites” (with Fuse.js search), a magazine-style **blog**, a **digital product store**, and supporting pages (pricing, advertise, submit, sign-in/up, system styleguide). It fits **SaaS/marketing, template marketplaces, and curated listings**. Publisher: [Lexington Themes](https://lexingtonthemes.com/).

## Tech stack

| Area | Details |
|------|---------|
| **Framework** | [Astro](https://astro.build/) `^6.0.0` |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) `^4.1.18` via `@tailwindcss/vite` |
| **Markdown / MDX** | `@astrojs/mdx` `^5.0.0`; content collections in `src/content.config.ts` |
| **Other integrations** | `@astrojs/sitemap` `^3.7.1`, `@astrojs/rss` `^4.0.17` |
| **Tailwind plugins (deps)** | `@tailwindcss/forms`, `@tailwindcss/typography`, `tailwind-scrollbar-hide` |
| **Lexington** | `@lexingtonthemes/seo` `^0.1.0` (e.g. `AstroSeo` in `src/components/fundations/head/Seo.astro`) |
| **Aliases** | `@/*` → `src/*` (`tsconfig.json`) |

**Config:** `astro.config.mjs` — `site: 'https://yourdomain.com'`, Shiki `min-light`, `markdown.drafts: true`, integrations `sitemap()`, `mdx()`.

## Folder map

| Path | Role |
|------|------|
| `src/pages/` | File-based routes (see Routing below) |
| `src/layouts/` | `BaseLayout`, `BlogLayout`, `LegalLayout`, `StoreLayout`, `SitesLayout` |
| `src/components/` | UI: `fundations/` (design system), `navigation/`, `global/`, `landing/`, `blog/`, `store/`, `sites/`, `assets/` |
| `src/content/` | Markdown **sources** for collections (`legal/`, `store/`, `sites/`, `posts/`) — not the Astro `content.config` file (that lives in `src/content.config.ts`) |
| `src/styles/` | `global.css` — Tailwind import, `@theme` tokens, plugins |
| `src/images/` | Images referenced from content `image()` fields and components (e.g. `blog/`, `sites/`, `store/`, `lex.jpg`) |

**`public/`:** not present in this repository (no static asset root checked in here).

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
| `/blog/` | `src/pages/blog/index.astro` — lists `posts` collection |
| `/blog/posts/[slug]/` | `src/pages/blog/posts/[...slug].astro` — `slug` = post `id` (e.g. `1` → `/blog/posts/1`) |
| `/blog/tags/`, `/blog/tags/[tag]/` | Tag index + filtered posts |
| `/store/`, `/store/[slug]` | Store grid + product detail (`trailingSlash: false` in route) |
| `/sites/site/[slug]` | Site detail from `sites` collection (`src/pages/sites/site/[...slug].astro`) |
| `/sites/tags/`, `/sites/tags/[tag]/` | Tag index + filtered `sites` |
| `/legal/[slug]` | Legal pages (`trailingSlash: false` in route) |
| `/rss.xml` | `src/pages/rss.xml.js` — **note:** uses `import.meta.glob('./blog/*.{md,mdx}')` under `src/pages/`; there is no such markdown tree next to that file (blog bodies live in `src/content/posts/`). Adjust if you need a working feed from collections. |
| `/system/*` | Styleguide (`overview`, `colors`, `typography`, `buttons`, `links`) |
| Other | `pricing`, `about`, `advertise`, `submit`, `signup`, `signin`, `404` as single files in `src/pages/` |

**Changelog:** not present as a collection or route in this repo.

## Customization

- **Site URL / domain:** `site` in `astro.config.mjs` (currently `https://yourdomain.com`). Align with placeholders in `src/components/fundations/head/Seo.astro` and any canonical/OG URLs.
- **Brand colors / typography:** `src/styles/global.css` — `@theme` (`--font-sans`, `--font-display`, `--color-accent-*`, `--color-base-*`). Optional fine-tuning: `src/pages/system/colors.astro`, `typography.astro`.
- **Navigation / footer:** `src/components/navigation/Navigation.astro`, `MobileNav.astro`, `src/components/global/Footer.astro`.
- **Global shell / head:** `src/layouts/BaseLayout.astro` (nav, search, footer toggles); `src/components/fundations/head/BaseHead.astro` (pulls `Seo`, `Meta`, `Fonts`, `Favicons`, `FuseJS`).

## Commands

From `README.md` (run at repo root):

- `npm install` — dependencies  
- `npm run dev` / `npm start` — dev server  
- `npm run build` — output to `./dist/`  
- `npm run preview` — preview production build  
- `npm run astro ...` — Astro CLI  

## Guardrails

- Keep the folder name **`fundations`** as spelled in this repo (do not “fix” to *foundations* without a coordinated rename everywhere).
- Do not expand content schemas lightly; update all consumers (layouts, cards, `getStaticPaths`) in the same change.
- Prefer small diffs and existing patterns (`@/` imports, collection names `posts` | `sites` | `store` | `legal`).

## Lexington links (from README)

- Theme specs: https://lexingtonthemes.com/templates/carbon  
- Documentation: https://lexingtonthemes.com/documentation  
- Changelog (theme): https://lexingtonthemes.com/changelog/carbon  
- Support: https://lexingtonthemes.com/legal/support/  
- Bundle: https://lexingtonthemes.com  
