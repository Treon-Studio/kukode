# Kukode Platform - PRD & Component Mapping

Dibuat: 2026-05-18
Base: Lexington Themes Carbon (Astro 5)

---

## 1. Overview

**Kukode** adalah platform discovery produk digital Indonesia berbasis Astro 5. Platform ini memungkinkan pengguna untuk discovering, submitting, dan managing produk digital (SaaS, template, plugin, dll).

---

## 2. Tech Stack & Dependencies

| Package | Version |
|---------|---------|
| astro | ^6.0.0 |
| @astrojs/mdx | ^5.0.0 |
| @astrojs/sitemap | ^3.7.1 |
| @astrojs/rss | ^4.0.17 |
| @lexingtonthemes/seo | ^0.1.0 |
| tailwindcss | ^4.1.18 |
| @tailwindcss/forms | ^0.5.11 |
| @tailwindcss/typography | ^0.5.19 |
| tailwind-scrollbar-hide | ^4.0.0 |

---

## 3. Page Inventory

### 3.1 Pages & Props

| Page | Path | Props | Purpose |
|------|------|-------|---------|
| index | `src/pages/index.astro` | `showSearch?: boolean` (default: true) | Homepage dengan Hero, SitesPreview, BlogPreview, StorePreview |
| blog/index | `src/pages/blog/index.astro` | - | Blog listing dengan tag filtering |
| blog/posts/[...slug] | `src/pages/blog/posts/[...slug].astro` | `slug: string` (required) | Individual blog post |
| blog/tags/index | `src/pages/blog/tags/index.astro` | - | All blog tags |
| blog/tags/[tag] | `src/pages/blog/tags/[tag].astro` | `tag: string` (required) | Posts filtered by tag |
| sites/tags/index | `src/pages/sites/tags/index.astro` | - | All site tags |
| sites/tags/[tag] | `src/pages/sites/tags/[tag].astro` | `tag: string` (required) | Sites filtered by tag |
| sites/site/[...slug] | `src/pages/sites/site/[...slug].astro` | `slug: string` (required) | Site detail page |
| store/index | `src/pages/store/index.astro` | - | Store listing |
| store/[...slug] | `src/pages/store/[...slug].astro` | `slug: string` (required) | Product detail |
| legal/[...slug] | `src/pages/legal/[...slug].astro` | `slug: string` (required) | Legal pages (terms, privacy) |
| pricing | `src/pages/pricing.astro` | - | Pricing page |
| about | `src/pages/about.astro` | - | About page |
| advertise | `src/pages/advertise.astro` | - | Advertising packages |
| submit | `src/pages/submit.astro` | - | Submit site info |
| signin | `src/pages/signin.astro` | `hideNav?: boolean`, `hideFooter?: boolean` | Sign in form |
| signup | `src/pages/signup.astro` | `hideNav?: boolean`, `hideFooter?: boolean` | Sign up form |
| 404 | `src/pages/404.astro` | - | Error page |
| rss.xml | `src/pages/rss.xml.js` | - | RSS feed (**BROKEN** - wrong path) |

### 3.2 Page Status Summary

| Status | Count | Pages |
|--------|-------|-------|
| Done | 14 | index, blog/*, sites/*, store/*, legal/*, pricing, about, 404 |
| Partial | 4 | advertise, submit, signin, signup (UI only, no backend) |
| Broken | 1 | rss.xml (wrong glob path) |

---

## 4. Component Inventory

### 4.1 Landing Components

#### Hero
| Property | Value |
|----------|-------|
| **Path** | `src/components/landing/Hero.astro` |
| **Props** | None |
| **Used In** | `src/pages/index.astro` |
| **Purpose** | Main hero section dengan headline dan description |

#### SitesPreview
| Property | Value |
|----------|-------|
| **Path** | `src/components/landing/SitesPreview.astro` |
| **Props** | None |
| **Used In** | `src/pages/index.astro` |
| **Purpose** | Featured sites dengan tag filtering dan "Show more" |
| **Children** | `SiteCard`, `SponsorCard` |

#### BlogPreview
| Property | Value |
|----------|-------|
| **Path** | `src/components/landing/BlogPreview.astro` |
| **Props** | None |
| **Used In** | `src/pages/index.astro` |
| **Purpose** | Latest 3 blog posts dengan link ke semua articles |
| **Children** | `BlogCard` |

#### StorePreview
| Property | Value |
|----------|-------|
| **Path** | `src/components/landing/StorePreview.astro` |
| **Props** | None |
| **Used In** | `src/pages/index.astro` |
| **Purpose** | Latest 3 store products dengan link ke semua products |
| **Children** | `StoreCard` |

---

### 4.2 Navigation Components

#### Navigation
| Property | Value |
|----------|-------|
| **Path** | `src/components/navigation/Navigation.astro` |
| **Props** | None |
| **Used In** | `src/layouts/BaseLayout.astro` |
| **Purpose** | Desktop navbar dengan Logo, nav links, Sign in/up buttons |
| **Children** | `Logo`, `MobileNav`, `Button` |

#### MobileNav
| Property | Value |
|----------|-------|
| **Path** | `src/components/navigation/MobileNav.astro` |
| **Props** | None |
| **Used In** | `src/components/navigation/Navigation.astro` |
| **Purpose** | Mobile hamburger menu dengan collapsible panel |
| **Children** | `Logo`, `Button` |

---

### 4.3 Global Components

#### Footer
| Property | Value |
|----------|-------|
| **Path** | `src/components/global/Footer.astro` |
| **Props** | None |
| **Used In** | `src/layouts/BaseLayout.astro` |
| **Purpose** | Footer dengan newsletter form dan social links |
| **Children** | `Logo`, `Text`, `Button` |

#### Logo
| Property | Value |
|----------|-------|
| **Path** | `src/components/global/Logo.astro` |
| **Props** | None |
| **Used In** | `Navigation`, `MobileNav`, `Footer` |
| **Purpose** | Site logo text linking ke homepage |

#### Faq
| Property | Value |
|----------|-------|
| **Path** | `src/components/global/Faq.astro` |
| **Props** | None |
| **Used In** | `src/pages/pricing.astro` |
| **Purpose** | Accordion FAQ dengan 10 predefined questions |
| **Children** | `Wrapper`, `Text` |

---

### 4.4 Card Components

#### SiteCard
| Property | Value |
|----------|-------|
| **Path** | `src/components/sites/SiteCard.astro` |
| **Props** | `post: object` (required) |
| **Used In** | `SitesPreview`, `src/pages/sites/tags/[tag].astro` |
| **Purpose** | Card displaying site thumbnail, title dengan hover effects |
| **Data Fields** | `post.data.title`, `post.data.live`, `post.data.thumbnail` |

#### BlogCard
| Property | Value |
|----------|-------|
| **Path** | `src/components/blog/BlogCard.astro` |
| **Props** | `post: object` (required) |
| **Used In** | `BlogPreview`, `blog/index`, `blog/tags/[tag]` |
| **Purpose** | Card displaying post image, date, tags, title |
| **Data Fields** | `post.data.title`, `post.data.image`, `post.data.tags`, `post.data.pubDate` |

#### StoreCard
| Property | Value |
|----------|-------|
| **Path** | `src/components/store/StoreCard.astro` |
| **Props** | `post: object` (required) |
| **Used In** | `StorePreview`, `store/index` |
| **Purpose** | Card displaying product image, price, title |
| **Data Fields** | `post.data.title`, `post.data.price`, `post.data.image` |

#### SponsorCard
| Property | Value |
|----------|-------|
| **Path** | `src/components/sites/SponsorCard.astro` |
| **Props** | None |
| **Used In** | `SitesPreview` |
| **Purpose** | Promotional sponsor card |

#### Search
| Property | Value |
|----------|-------|
| **Path** | `src/components/sites/Search.astro` |
| **Props** | None |
| **Used In** | `src/layouts/BaseLayout.astro` |
| **Purpose** | Fuzzy search modal dengan Fuse.js, keyboard shortcut (Cmd/Ctrl+K) |

---

### 4.5 Fundation Components (Design System)

#### Button
| Property | Value |
|----------|-------|
| **Path** | `src/components/fundations/elements/Button.astro` |
| **Props** | See table below |
| **Used In** | 17 places (most reusable) |

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `string` | No | `"default"` | Style: default, accent, muted, none |
| `size` | `string` | No | `"base"` | Size: xxs, xs, sm, base, md, lg, xl |
| `onlyIconSize` | `string` | No | - | Icon-only button size |
| `iconOnly` | `boolean` | No | `false` | Renders as icon-only |
| `gap` | `string` | No | - | Gap: xs, sm, base, md, lg |
| `isLink` | `boolean` | No | `false` | Renders as `<a>` instead of `<button>` |
| `class` | `string` | No | - | Additional CSS classes |
| `href` | `string` | No | - | Link href for isLink buttons |

#### Text
| Property | Value |
|----------|-------|
| **Path** | `src/components/fundations/elements/Text.astro` |
| **Props** | See table below |
| **Used In** | 24 places (most reused) |

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tag` | `string` | No | `"p"` | HTML tag: a, p, em, span, small, strong, blockquote, h1-h6 |
| `id` | `string` | No | - | Element ID |
| `rel` | `string` | No | - | Rel attribute for anchor |
| `style` | `string` | No | - | Inline styles |
| `target` | `string` | No | - | Target for links |
| `href` | `string` | No | - | Href for anchor tags |
| `title` | `string` | No | - | Title attribute |
| `variant` | `string` | No | `"textBase"` | Style variant (displayXL-5XL, textXL-XS) |
| `class` | `string` | No | - | Additional CSS classes |
| `ariaLabel` | `string` | No | - | ARIA label |

#### Wrapper
| Property | Value |
|----------|-------|
| **Path** | `src/components/fundations/containers/Wrapper.astro` |
| **Props** | See table below |
| **Used In** | 21 places |

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `string` | No | `"standard"` | Wrapper variant: heroNarrow, narrow, standard, prose |
| `class` | `string` | No | - | Additional CSS classes |

#### BaseHead
| Property | Value |
|----------|-------|
| **Path** | `src/components/fundations/head/BaseHead.astro` |
| **Props** | None |
| **Children** | `Seo`, `Meta`, `Fonts`, `Favicons`, `FuseJS` |
| **Used In** | `src/layouts/BaseLayout.astro` |

#### Seo
| Property | Value |
|----------|-------|
| **Path** | `src/components/fundations/head/Seo.astro` |
| **Props** | Props via AstroSeo component |
| **Purpose** | SEO meta tags, Open Graph, Twitter cards |
| **Children** | Manual `<meta>` tags |

#### Meta
| Property | Value |
|----------|-------|
| **Path** | `src/components/fundations/head/Meta.astro` |
| **Props** | None (hardcoded) |
| **Purpose** | Basic meta tags: title, description, keywords, author |

#### Fonts
| Property | Value |
|----------|-------|
| **Path** | `src/components/fundations/head/Fonts.astro` |
| **Props** | None |
| **Purpose** | Google Fonts loading |

#### Favicons
| Property | Value |
|----------|-------|
| **Path** | `src/components/fundations/head/Favicons.astro` |
| **Props** | None |
| **Purpose** | Favicon links |

#### FuseJS
| Property | Value |
|----------|-------|
| **Path** | `src/components/fundations/scripts/FuseJS.astro` |
| **Props** | None |
| **Purpose** | Fuse.js library loading untuk search |

---

### 4.6 Icons

| Icon | Path |
|------|------|
| ArrowUpRight | `src/components/fundations/icons/ArrowUpRight.astro` |
| Burger | `src/components/fundations/icons/Burger.astro` |
| Checkbox | `src/components/fundations/icons/Checkbox.astro` |
| Close | `src/components/fundations/icons/Close.astro` |
| Command | `src/components/fundations/icons/Command.astro` |
| Plus | `src/components/fundations/icons/Plus.astro` |
| Search | `src/components/fundations/icons/Search.astro` |
| Checkout | `src/components/fundations/icons/Checkout.astro` |

---

## 5. Content Collections

| Collection | Path | Schema Fields | Status |
|------------|------|----------------|--------|
| posts (blog) | `src/content/posts/` | title, pubDate, description, image, tags | Done |
| sites | `src/content/sites/` | live, title, tagline, description, thumbnail, tags, isNew, details | Done |
| store | `src/content/store/` | price, title, preview, checkout, license, highlights, description, features, image, gallery | Done |
| legal | `src/content/legal/` | page, pubDate | Done |

---

## 6. Layouts

| Layout | Path | Purpose |
|--------|------|---------|
| BaseLayout | `src/layouts/BaseLayout.astro` | Main shell dengan Nav, Search, Footer |
| BlogLayout | `src/layouts/BlogLayout.astro` | Blog post layout |
| StoreLayout | `src/layouts/StoreLayout.astro` | Store product layout |
| LegalLayout | `src/layouts/LegalLayout.astro` | Legal pages layout |
| SitesLayout | `src/layouts/SitesLayout.astro` | Site detail layout |

**BaseLayout Props:**
```typescript
{
  hideNavigation?: boolean;  // default: false
  hideFooter?: boolean;      // default: false
  hideSearch?: boolean;       // legacy flag
  showSearch?: boolean;      // default: false
}
```

---

## 7. Missing Components (Gap Analysis)

| Component | Priority | Status | Catatan |
|-----------|----------|--------|---------|
| **Auth Backend** | HIGH | MISSING | signin/signup UI only, butuh auth provider |
| **User Dashboard** | HIGH | MISSING | `/dashboard/` belum ada |
| **Submission Handler** | HIGH | MISSING | submit form belum connect backend |
| **Wishlist Feature** | HIGH | MISSING | Sistem saved items belum ada |
| **Contact Form Handler** | MEDIUM | MISSING | advertise page perlu form handler |
| **Comment System** | MEDIUM | MISSING | Untuk blog posts |
| **Checkout Flow** | MEDIUM | MISSING | Store ada, payment integration belum |
| **RSS Feed Fix** | HIGH | BROKEN | rss.xml.js pakai wrong glob path |
| **Analytics Integration** | LOW | MISSING | Tracking belum ada |

---

## 8. File Structure

```
src/
├── pages/
│   ├── index.astro              # Homepage
│   ├── about.astro
│   ├── pricing.astro
│   ├── advertise.astro         # Partial - no form handler
│   ├── submit.astro            # Partial - no backend
│   ├── signin.astro            # Partial - UI only
│   ├── signup.astro             # Partial - UI only
│   ├── 404.astro
│   ├── rss.xml.js               # BROKEN - wrong path
│   ├── blog/
│   │   ├── index.astro
│   │   ├── posts/[...slug].astro
│   │   └── tags/
│   │       ├── index.astro
│   │       └── [tag].astro
│   ├── sites/
│   │   ├── tags/
│   │   │   ├── index.astro
│   │   │   └── [tag].astro
│   │   └── site/[...slug].astro
│   ├── store/
│   │   ├── index.astro
│   │   └── [...slug].astro
│   ├── legal/[...slug].astro
│   └── system/
│       ├── overview.astro
│       ├── colors.astro
│       ├── typography.astro
│       ├── buttons.astro
│       └── links.astro
├── components/
│   ├── landing/
│   │   ├── Hero.astro
│   │   ├── SitesPreview.astro
│   │   ├── BlogPreview.astro
│   │   └── StorePreview.astro
│   ├── navigation/
│   │   ├── Navigation.astro
│   │   └── MobileNav.astro
│   ├── global/
│   │   ├── Footer.astro
│   │   ├── Logo.astro
│   │   └── Faq.astro
│   ├── blog/
│   │   └── BlogCard.astro
│   ├── store/
│   │   └── StoreCard.astro
│   ├── sites/
│   │   ├── SiteCard.astro
│   │   ├── Search.astro
│   │   └── SponsorCard.astro
│   └── fundations/
│       ├── head/
│       │   ├── BaseHead.astro
│       │   ├── Seo.astro
│       │   ├── Meta.astro
│       │   ├── Fonts.astro
│       │   └── Favicons.astro
│       ├── elements/
│       │   ├── Button.astro
│       │   └── Text.astro
│       ├── containers/
│       │   └── Wrapper.astro
│       ├── icons/
│       │   └── [7 icons]
│       └── scripts/
│           └── FuseJS.astro
├── layouts/
│   ├── BaseLayout.astro
│   ├── BlogLayout.astro
│   ├── StoreLayout.astro
│   ├── LegalLayout.astro
│   └── SitesLayout.astro
├── content/
│   ├── config.ts
│   ├── posts/
│   ├── sites/
│   ├── store/
│   └── legal/
├── styles/
│   └── global.css
└── images/
```

---

## 9. Reusable Component Usage Stats

| Component | Usage Count | Files |
|-----------|-------------|-------|
| Text | 24 | 22 files |
| Wrapper | 21 | 21 files |
| Button | 17 | 17 files |
| Logo | 3 | Navigation, MobileNav, Footer |

---

## 10. Sprint Order Recommendations

```
Sprint 1: Foundation
├── Fix RSS Feed (rss.xml.js path issue)
├── Setup Auth Backend (Auth.js/Supabase)
└── Setup Database Infrastructure

Sprint 2: Core Features
├── User Dashboard (/dashboard/)
├── Site Submission Handler
└── Basic User Profile

Sprint 3: Engagement
├── Wishlist Feature
├── Comment System
└── Email Notifications

Sprint 4: Monetization
├── Checkout/Payment Integration
├── Advertise Form Handler
└── Pricing Enhancement

Sprint 5: Polish
├── Analytics Integration
├── Performance Optimization
└── SEO Enhancement
```

---

## 11. Immediate Actions

1. **Fix RSS Feed** - `src/pages/rss.xml.js` gunakan content collection API
2. **Auth Backend** - Pilih dan implement auth provider
3. **Build Dashboard** - Buat `src/pages/dashboard/index.astro`
4. **Connect Submit Form** - Integrasi dengan email/database