# PRD: Kukode — Platform Discovery & Marketplace Produk Digital Indonesia

Dibuat: 2026-05-18
Diperbarui: 2026-05-19 (tambah Feature Flags US-013 & Analytics System US-014)
Base: Lexington Themes Carbon (Astro 6)

---

## Introduction

**Kukode** adalah platform discovery produk digital Indonesia berbasis Astro 6. Platform ini memungkinkan pengguna untuk discovering, submitting, voting, dan managing produk digital (SaaS, template, plugin, dll). Codebase sudah berjalan dengan UI static; backlog utama adalah menghubungkan backend (auth, database, payment) ke UI yang sudah ada.

---

## Status Codebase Saat Ini

| Area | Status | Keterangan |
|---|---|---|
| UI / Layout | ✅ Done | BaseLayout, Navigation, Footer, semua halaman static sudah ada |
| Content Collections | ✅ Done | `posts`, `sites`, `store`, `legal` — schema sudah defined |
| Search (Fuse.js) | ✅ Done | Fuzzy search modal dengan Cmd+K, sudah terintegrasi |
| Auth Backend | ❌ Missing | `signin.astro` & `signup.astro` UI only, belum ada provider |
| Submit Handler | ❌ Missing | `submit.astro` UI only, belum connect ke backend |
| User Dashboard | ❌ Missing | `/dashboard/` belum ada |
| Wishlist / Upvote | ❌ Missing | Belum ada |
| Comment System | ❌ Missing | Belum ada |
| Checkout / Payment | ❌ Missing | Store ada, Xendit belum terintegrasi |
| RSS Feed | 🔴 Broken | `rss.xml.js` — wrong glob path, harus difix sprint 1 |
| Analytics | ❌ Missing | Tracking belum ada |
| Feature Flags | ❌ Missing | Belum ada sistem toggle fitur |
| Analytics System | ❌ Missing | Platform & maker analytics belum ada |

---

## Tech Stack

| Layer | Teknologi | Versi / Keterangan |
|---|---|---|
| **Framework** | Astro | `^6.0.0` — sudah di package.json |
| **Styling** | Tailwind CSS | `^4.1.18` + forms + typography plugins |
| **Search** | Fuse.js | Sudah terintegrasi via `FuseJS.astro` + `Search.astro` |
| **SEO** | @lexingtonthemes/seo | `^0.1.0` — dipakai via `Seo.astro` |
| **Database & Auth** | Supabase | PostgreSQL + Auth (email, Google, GitHub) + Storage |
| **Cache & Rate Limit** | Upstash Redis | REST API — compatible dengan Astro SSR / edge |
| **Payment** | Xendit | Sponsored listing + store checkout — QRIS, VA, OVO, GoPay, Transfer Bank |
| **Email** | Resend | Notifikasi transactional; Supabase untuk auth email |
| **Cron** | Supabase pg_cron + Edge Functions | Hitung POTD tiap 00.00 WIB |
| **Deployment** | Vercel / Netlify | SSR via serverless functions |
| **Feature Flags** | Supabase `feature_flags` table + Upstash Redis | Zero dependency baru; cache hasil flag TTL 60 detik |
| **Analytics** | Supabase `site_events` + Upstash Redis (HyperLogLog) | Server-side tracking; DAU/MAU via HyperLogLog |

---

## Goals

- Menghubungkan auth backend ke halaman `signin.astro` dan `signup.astro` yang sudah ada
- Mengaktifkan submission produk dari `submit.astro` ke Supabase
- Membangun halaman `/dashboard/` untuk maker dan user
- Menambah sistem upvote pada `SiteCard` yang sudah ada
- Mengintegrasikan Xendit ke `advertise.astro` dan `store/[...slug].astro`
- Memperbaiki RSS feed yang broken
- Menambah comment system pada `SitesLayout.astro`
- Membangun sistem feature flags untuk rollout bertahap dan kill switch darurat
- Mengimplementasikan analytics dua lapis: platform analytics (admin) dan maker analytics (per produk)

---

## Existing Pages & Components (Referensi Wajib)

### Pages yang Sudah Ada

| Page | Path | Status | Kebutuhan Backend |
|---|---|---|---|
| Homepage | `src/pages/index.astro` | ✅ Done | Tidak ada |
| Blog listing | `src/pages/blog/index.astro` | ✅ Done | Tidak ada |
| Blog post | `src/pages/blog/posts/[...slug].astro` | ✅ Done | Comment system |
| Site detail | `src/pages/sites/site/[...slug].astro` | ✅ Done | Vote, comment, analytics |
| Store detail | `src/pages/store/[...slug].astro` | ✅ Done | Xendit checkout |
| Advertise | `src/pages/advertise.astro` | ⚠️ Partial | Form handler + Xendit |
| Submit | `src/pages/submit.astro` | ⚠️ Partial | Backend handler Supabase |
| Sign In | `src/pages/signin.astro` | ⚠️ Partial | Supabase Auth |
| Sign Up | `src/pages/signup.astro` | ⚠️ Partial | Supabase Auth |
| RSS Feed | `src/pages/rss.xml.js` | 🔴 Broken | Fix glob path |

### Komponen Existing yang Akan Diextend

| Komponen | Path | Yang Perlu Ditambahkan |
|---|---|---|
| `SiteCard` | `src/components/sites/SiteCard.astro` | Tombol upvote + vote count |
| `SponsorCard` | `src/components/sites/SponsorCard.astro` | Link ke site sponsored aktif |
| `SitesPreview` | `src/components/landing/SitesPreview.astro` | Filter tab Hari Ini/Minggu/Bulan |
| `Navigation` | `src/components/navigation/Navigation.astro` | User avatar/dropdown jika sudah login |
| `Footer` | `src/components/global/Footer.astro` | Newsletter form handler |

### Komponen yang Dipakai As-Is (jangan rebuild)

- `Button` — `src/components/fundations/elements/Button.astro`
- `Text` — `src/components/fundations/elements/Text.astro`
- `Wrapper` — `src/components/fundations/containers/Wrapper.astro`
- `Search` — `src/components/sites/Search.astro` (Fuse.js, sudah OK)
- Semua icons di `src/components/fundations/icons/`

### Content Collections Schema (Existing — jangan ubah)

```typescript
// sites collection: src/content/sites/
{
  live: string,        // URL produk live
  title: string,
  tagline: string,
  description: string,
  thumbnail: string,
  tags: string[],
  isNew: boolean,
  details: string,     // MDX content
}

// store collection: src/content/store/
{
  price: number,
  title: string,
  preview: string,
  checkout: string,    // akan diganti Xendit flow
  license: string,
  highlights: string[],
  description: string,
  features: string[],
  image: string,
  gallery: string[],
}
```

---

## User Stories

### US-001: Fix RSS Feed
**Description:** As a developer, I want to fix the broken RSS feed so that users can subscribe to Kukode content.

**File:** `src/pages/rss.xml.js`

**Acceptance Criteria:**
- [ ] Ganti glob path yang salah dengan content collection API (`getCollection('posts')`)
- [ ] `/rss.xml` dapat diakses dan valid (cek via RSS validator online)
- [ ] Feed berisi semua blog posts dengan `title`, `pubDate`, `description`, `link`
- [ ] Typecheck/lint passes

---

### US-002: Auth Backend — Sign In & Sign Up
**Description:** As a user, I want to register and login using the existing signin/signup pages so that I can interact with the platform.

**Files yang dimodifikasi:**
- `src/pages/signin.astro` — tambah form action ke Supabase Auth
- `src/pages/signup.astro` — tambah form action ke Supabase Auth
- `src/pages/api/auth/signin.ts` *(buat baru)*
- `src/pages/api/auth/signup.ts` *(buat baru)*
- `src/pages/api/auth/signout.ts` *(buat baru)*
- `src/middleware.ts` *(buat baru)* — proteksi route `/dashboard/*` dan `/admin/*`

**Acceptance Criteria:**
- [ ] Install `@supabase/ssr` dan setup env vars (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Form di `signin.astro` POST ke `/api/auth/signin`; session disimpan via cookie httpOnly
- [ ] Form di `signup.astro` POST ke `/api/auth/signup`; Supabase kirim email verifikasi
- [ ] Setelah login berhasil, redirect ke `/dashboard`
- [ ] Middleware proteksi: akses `/dashboard/*` atau `/admin/*` tanpa session → redirect ke `/signin`
- [ ] `Navigation.astro`: jika user sudah login, tampilkan avatar + dropdown (Profile, Dashboard, Logout) menggantikan tombol Sign In/Up
- [ ] Login via Google OAuth (setup provider di Supabase dashboard)
- [ ] Login via GitHub OAuth (setup provider di Supabase dashboard)
- [ ] Gunakan props `hideNav` dan `hideFooter` yang sudah ada di `signin.astro`/`signup.astro` (sudah tersedia di BaseLayout)
- [ ] Username di-generate otomatis dari email saat signup (contoh: `budi.santoso@gmail.com` → `budi-santoso`); user bisa ganti kapan saja via `/dashboard/settings`
- [ ] Username harus unik; jika ada konflik, tambahkan suffix angka random (contoh: `budi-santoso-42`)
- [ ] Error inline di form: email sudah terdaftar, password salah, email belum verifikasi
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Submit Produk — Connect Backend
**Description:** As a maker, I want the existing submit form to actually save my product to the database.

**Files yang dimodifikasi:**
- `src/pages/submit.astro` — sambungkan form ke API endpoint
- `src/pages/api/sites/submit.ts` *(buat baru)*

**Acceptance Criteria:**
- [ ] `submit.astro` redirect ke `/signin?redirect=/submit` jika user belum login
- [ ] Field wajib sesuai schema `sites` content collection: `title`, `tagline` (maks 60 karakter), `live` (URL), `thumbnail`, `description`, `tags`
- [ ] Upload thumbnail ke Supabase Storage bucket `site-thumbnails`; maks 5MB, format JPG/PNG/WebP
- [ ] Data tersimpan ke tabel `submitted_sites` di Supabase dengan status `pending_review`
- [ ] Duplicate check: jika `live_url` sudah ada → error "Produk ini sudah pernah disubmit. [Lihat →]"
- [ ] Maker menerima email konfirmasi submit via Resend
- [ ] Setelah submit berhasil, redirect ke `/dashboard` dengan toast sukses
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Upvote pada SiteCard
**Description:** As a logged-in user, I want to upvote sites directly from the card so that great products get more visibility.

**Files yang dimodifikasi:**
- `src/components/sites/SiteCard.astro` — tambah upvote button + counter
- `src/pages/api/sites/vote.ts` *(buat baru)*

**Acceptance Criteria:**
- [ ] Tombol upvote (△) + jumlah vote tampil di `SiteCard` (pojok kanan bawah card)
- [ ] Vote count diambil dari Supabase, di-cache Upstash Redis (TTL 5 menit) dengan key `vote_count:{site_id}`
- [ ] Klik upvote → `POST /api/sites/vote` dengan `{ site_id }`
- [ ] 1 user hanya bisa vote 1x per site; klik kedua → batalkan vote (toggle)
- [ ] Optimistic UI: counter update instan tanpa reload (Astro Island dengan Vanilla JS atau Preact)
- [ ] User belum login → tooltip/modal "Login untuk vote" → link ke `/signin`
- [ ] Rate limiting via Upstash Redis: maks 20 vote actions per user per menit
- [ ] Maker tidak bisa vote produk sendiri → tombol disabled + tooltip "Ini produkmu"
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Site Detail — Vote, Komentar & Tracking
**Description:** As a visitor, I want to see vote count, leave comments, and have my visit tracked on a site detail page.

**Files yang dimodifikasi:**
- `src/layouts/SitesLayout.astro` — tambah vote section + comment section
- `src/pages/api/comments/index.ts` *(buat baru)*
- `src/pages/api/events/track.ts` *(buat baru)*

**Acceptance Criteria:**
- [ ] Vote count + tombol upvote besar tampil di `SitesLayout` (header area)
- [ ] Section komentar tampil di bawah detail site
- [ ] User login bisa submit komentar plain text (maks 1000 karakter) via `POST /api/comments`
- [ ] Maker bisa reply komentar (nested 1 level); reply maker tampil dengan badge "Maker"
- [ ] Komentar bisa di-upvote; urutan default: terpopuler; tab alternatif: terbaru
- [ ] User bisa report komentar → modal pilih alasan → tersimpan ke tabel `reports`
- [ ] Maker mendapat email via Resend saat ada komentar baru
- [ ] Tombol share: Twitter/X, WhatsApp, copy link (Web Share API)
- [ ] Tombol "Kunjungi Produk" mencatat click event ke tabel `site_events` via `POST /api/events/track`
- [ ] Page view juga dicatat server-side saat halaman di-load (bukan client-side script)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: User Dashboard
**Description:** As a user, I want a dashboard to manage my submitted products and see analytics.

**Files yang dibuat baru:**
- `src/pages/dashboard/index.astro`
- `src/pages/dashboard/products.astro`
- `src/pages/dashboard/analytics/[siteId].astro`
- `src/pages/dashboard/settings.astro`
- `src/layouts/DashboardLayout.astro`

**Acceptance Criteria:**
- [ ] Semua route `/dashboard/*` dilindungi middleware — redirect ke `/signin` jika tidak ada session
- [ ] `dashboard/index.astro`: ringkasan — jumlah produk submitted, total votes diterima, total views 30 hari
- [ ] `dashboard/products.astro`: daftar produk dengan status badge (`pending_review` / `approved` / `rejected`) + alasan jika rejected
- [ ] `dashboard/analytics/[siteId].astro`: views, votes, klik per hari (line chart 30 hari), top referrer, top negara/kota — hanya bisa diakses pemilik produk
- [ ] `dashboard/settings.astro`: edit nama, username, bio, avatar (upload Supabase Storage), website, Twitter, GitHub
- [ ] `DashboardLayout.astro` menggunakan `BaseLayout` dengan sidebar navigasi menggunakan `Button` dan `Text` existing
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: SitesPreview — Filter Tab & Dynamic Data
**Description:** As a visitor, I want to filter the sites preview by time period and see real vote counts.

**Files yang dimodifikasi:**
- `src/components/landing/SitesPreview.astro`

**Acceptance Criteria:**
- [ ] Tab filter: "Hari Ini · Minggu Ini · Bulan Ini · Semua" (default: Hari Ini)
- [ ] Data sites diambil dari Supabase tabel `submitted_sites` (status `approved`), bukan hanya dari content collection static
- [ ] Vote count per site di-cache Upstash Redis (TTL 5 menit)
- [ ] `SponsorCard` tetap tampil di posisi pertama jika ada site dengan `is_sponsored = true` yang aktif
- [ ] Filter state di-persist di URL param `?filter=week`
- [ ] Empty state jika tidak ada site: ilustrasi + tombol "Submit Produk Pertama"
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Product of the Day (POTD)
**Description:** As a user, I want to see the best product of the day on the homepage.

**Files yang dibuat/dimodifikasi:**
- `src/components/landing/ProductOfTheDay.astro` *(buat baru)*
- `src/pages/index.astro` — tambah `ProductOfTheDay` di atas `SitesPreview`
- Supabase Edge Function: `calculate-potd` *(deploy ke Supabase)*

**Acceptance Criteria:**
- [ ] Supabase pg_cron jalankan `calculate-potd` tiap 00.00 WIB — ambil site dengan vote terbanyak hari sebelumnya, simpan ke `potd_history`
- [ ] `ProductOfTheDay.astro` baca POTD hari ini dari `potd_history`; tampilkan thumbnail besar, nama, tagline, vote count, badge "🏆 Produk Terbaik Hari Ini"
- [ ] Komponen menggunakan `Text`, `Button`, `Wrapper` existing
- [ ] Halaman detail site POTD menampilkan badge POTD
- [ ] Maker POTD mendapat email notifikasi via Resend
- [ ] Jika tidak ada POTD → komponen tidak ditampilkan (graceful hide)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Leaderboard Page
**Description:** As a user, I want a dedicated leaderboard page for top products.

**Files yang dibuat baru:**
- `src/pages/leaderboard.astro`

**Acceptance Criteria:**
- [ ] `/leaderboard` dapat diakses tanpa login
- [ ] Tab: "Minggu Ini · Bulan Ini · Sepanjang Masa"
- [ ] Setiap entry: ranking number, thumbnail, nama, tagline, vote count, link ke detail
- [ ] Top 3 entry mendapat visual khusus (gold/silver/bronze)
- [ ] Data di-cache Upstash Redis (TTL 10 menit)
- [ ] Menggunakan `Wrapper`, `Text`, `Button` existing
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Advertise & Sponsored Listing via Xendit
**Description:** As a maker, I want to pay for sponsored placement via the existing advertise page using local payment methods.

**Files yang dimodifikasi/dibuat:**
- `src/pages/advertise.astro` — sambungkan form ke backend
- `src/pages/api/advertise/create-invoice.ts` *(buat baru)*
- `src/pages/api/webhooks/xendit.ts` *(buat baru)*

**Acceptance Criteria:**
- [ ] Form di `advertise.astro` memilih paket: 3 hari (Rp 300.000) / 7 hari (Rp 600.000) / 14 hari (Rp 1.000.000)
- [ ] Submit → `POST /api/advertise/create-invoice` → buat Xendit Invoice → redirect ke halaman bayar Xendit
- [ ] Xendit mendukung: Transfer Bank, QRIS, Virtual Account, OVO, GoPay, Dana
- [ ] Webhook `/api/webhooks/xendit` verifikasi `x-callback-token` sebelum proses
- [ ] `invoice.paid` → update `submitted_sites`: `is_sponsored = true`, `sponsored_until = now + durasi`
- [ ] `SponsorCard` di `SitesPreview` otomatis menampilkan site `is_sponsored = true`
- [ ] `invoice.expired` (24 jam tidak bayar) → tidak ada perubahan database
- [ ] Maks 3 slot sponsored aktif bersamaan; jika penuh → form tampilkan "Slot penuh, coba lagi nanti"
- [ ] Maker menerima email konfirmasi via Resend
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Store Checkout via Xendit
**Description:** As a user, I want to purchase store products using local Indonesian payment methods.

**Files yang dimodifikasi/dibuat:**
- `src/pages/store/[...slug].astro` — ganti field `checkout` static dengan Xendit flow
- `src/pages/api/store/create-invoice.ts` *(buat baru)*

**Acceptance Criteria:**
- [ ] Tombol "Beli Sekarang" di `store/[...slug].astro` POST ke `/api/store/create-invoice`
- [ ] Invoice dibuat berdasarkan `price` dan `title` dari content collection `store`
- [ ] User di-redirect ke halaman pembayaran Xendit
- [ ] Webhook menerima `invoice.paid` → simpan ke tabel `purchases` di Supabase
- [ ] User menerima email dengan link akses/download produk via Resend
- [ ] Setelah Xendit live dan semua produk store sudah diuji, hapus field `checkout` dari schema content collection `store`
- [ ] Pastikan tidak ada referensi ke field `checkout` yang tersisa di template `store/[...slug].astro`
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-012: Admin Panel — Moderasi
**Description:** As an admin, I want to review and approve submitted products via a dedicated admin panel.

**Files yang dibuat baru:**
- `src/pages/admin/index.astro`
- `src/pages/admin/products.astro`
- `src/pages/admin/reports.astro`
- `src/pages/api/admin/approve.ts`
- `src/pages/api/admin/reject.ts`
- `src/layouts/AdminLayout.astro`

**Acceptance Criteria:**
- [ ] Route `/admin/*` hanya bisa diakses role `admin` (cek di middleware + Supabase RLS)
- [ ] `admin/products.astro`: daftar `pending_review` — preview thumbnail, nama, URL, tanggal submit
- [ ] Approve → `POST /api/admin/approve` → status `approved` → maker dapat email konfirmasi
- [ ] Reject → modal wajib isi alasan → `POST /api/admin/reject` → maker dapat email dengan alasan
- [ ] Produk `approved` otomatis muncul di `SitesPreview` homepage
- [ ] `admin/reports.astro`: daftar komentar flagged; admin bisa hapus komentar
- [ ] Admin bisa toggle `is_sponsored` secara manual
- [ ] `AdminLayout.astro` menggunakan `BaseLayout` dengan `Wrapper`, `Button`, `Text` existing
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-013: Feature Flags System
**Description:** As a developer/admin, I want to control feature activation without redeployment so that I can do gradual rollouts, A/B testing, and emergency kill switches.

**Files yang dibuat baru:**
- `src/lib/flags.ts` — helper `isEnabled(flagName, userId?)`
- `src/pages/admin/flags.astro` — UI admin toggle flags
- `src/pages/api/admin/flags.ts` — CRUD endpoint flags

**Acceptance Criteria:**
- [ ] Tabel `feature_flags` dibuat di Supabase dengan kolom: `flag_name`, `enabled`, `rollout_pct`, `whitelist`, `env`, `description`, `updated_at`, `updated_by`
- [ ] Helper `isEnabled(flagName, userId?)` mengikuti priority: env override → whitelist → rollout % → global enabled
- [ ] Hasil `isEnabled` di-cache di Upstash Redis dengan key `flag:{flagName}:{userId|anon}` (TTL 60 detik)
- [ ] Kill switch aktif dalam < 60 detik setelah admin toggle flag di UI
- [ ] Halaman `/admin/flags` menampilkan semua flags dengan toggle switch, input rollout %, dan log perubahan
- [ ] Flag `auto_approve` dipakai di `api/sites/submit.ts` — jika disabled, semua submit masuk `pending_review`
- [ ] Flag `sponsored_listing` dipakai di `SitesPreview.astro` — jika disabled, `SponsorCard` tidak dirender
- [ ] Flag `search_supabase_fts` dipakai di `Search.astro` — canary rollout 10% → 50% → 100%
- [ ] Env override: `FEATURE_{FLAG_NAME}=true/false` di `.env` mengoverride semua nilai dari DB
- [ ] Seed data 12 flags awal sudah tersedia di migration SQL
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

### US-014: Analytics System — Platform & Maker
**Description:** As an admin and maker, I want to see accurate analytics so that I can make data-driven decisions about the platform and my products.

**Files yang dibuat baru:**
- `src/lib/analytics.ts` — helper `trackEvent()` dan aggregation queries
- `src/pages/api/events/track.ts` *(expand dari US-005)* — ingestion endpoint dengan rate limiting
- `src/pages/admin/analytics.astro` — platform analytics dashboard untuk admin
- `src/pages/dashboard/analytics/[siteId].astro` *(expand dari US-006)* — maker analytics per produk

**Event Types yang Di-track:**
- `page_view` — halaman site detail dibuka (server-side saat render)
- `product_click` — klik "Kunjungi Produk"
- `upvote` / `unvote` — aksi vote
- `comment_submit` — submit komentar
- `search_query` — pencarian dengan query ≥ 3 karakter
- `signup` — user baru mendaftar
- `submit_product` — maker submit produk

**Acceptance Criteria:**
- [ ] Semua tracking server-side via Astro SSR — tidak ada client-side script, tidak diblok ad-blocker
- [ ] `trackEvent()` insert ke tabel `site_events` DAN INCR counter di Upstash Redis secara bersamaan
- [ ] DAU dihitung via Redis HyperLogLog: `PFADD dau:{date} {userId}` — deduplicated, tidak simpan PII
- [ ] MAU dihitung via Redis HyperLogLog: `PFADD mau:{YYYY-MM} {userId}`
- [ ] Rate limiting tracking: maks 100 events per IP per menit (Upstash Redis)
- [ ] Semua timestamp menggunakan timezone WIB (UTC+7) untuk grouping harian
- [ ] **Platform Analytics** (`/admin/analytics`): DAU, MAU, total produk live, submit hari ini, total votes hari ini, top kategori, top negara, signup rate 30 hari, revenue bulan ini
- [ ] **Maker Analytics** (`/dashboard/analytics/[siteId]`): total views, total clicks, total votes, CTR (clicks/views×100), grafik views+votes per hari 30 hari, top referrer, top negara, performa vs rata-rata kategori
- [ ] Analytics data di-cache Redis (TTL 5 menit untuk maker, TTL 1 jam untuk platform)
- [ ] Export CSV dari maker analytics: kolom date, views, clicks, votes, comments (30 hari terakhir)
- [ ] Akses maker analytics dilindungi: hanya pemilik produk (`auth.uid() = maker_id`)
- [ ] Akses platform analytics dilindungi: hanya role `admin`
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

---

## Functional Requirements

- **FR-1:** Auth via Supabase Auth (`@supabase/ssr`); session cookie httpOnly; provider: email, Google, GitHub
- **FR-2:** Middleware Astro (`src/middleware.ts`) proteksi `/dashboard/*` dan `/admin/*`
- **FR-3:** Submit produk → auto-approve jika memenuhi kriteria: URL `live` valid (HTTP 200) + thumbnail berhasil diupload; jika salah satu gagal → status `pending_review` untuk review manual admin; hanya status `approved` yang tampil publik di `SitesPreview`
- **FR-4:** Vote disimpan di Supabase tabel `votes`; counter di-cache Upstash Redis key `vote_count:{site_id}` (TTL 5 menit)
- **FR-5:** 1 user = 1 vote per site; toggle untuk batalkan; maker tidak bisa vote milik sendiri
- **FR-6:** Komentar plain text, nested 1 level; notifikasi maker via Resend
- **FR-7:** Upload gambar ke Supabase Storage bucket `site-thumbnails`; maks 5MB; JPG/PNG/WebP
- **FR-8:** POTD dan expired sponsored cleanup via **Cloudflare Workers Cron Triggers** jika deploy di Cloudflare Pages (gratis, 100K req/hari); fallback ke **Supabase pg_cron** jika deploy di Vercel/Netlify; cron berjalan tiap 00.00 WIB
- **FR-9:** Xendit webhook di `/api/webhooks/xendit` wajib verifikasi `x-callback-token` sebelum update database
- **FR-10:** Search: migrasi ke **Supabase full-text search** (`tsvector`) sebagai satu-satunya search engine; semua konten (blog posts, sites static, submitted_sites) di-index ke Supabase; Fuse.js tetap sebagai UI layer (instant debounce) tapi data-nya dari Supabase, bukan dari bundle static
- **FR-11:** SEO via `Seo.astro` existing (`@lexingtonthemes/seo`); OG tags otomatis per halaman site
- **FR-12:** Role: `user` (default), `maker` (auto saat submit pertama), `admin` (manual di Supabase dashboard)
- **FR-13:** Analytics tracking server-side via `POST /api/events/track`; tidak ada client-side script
- **FR-14:** Feature flags dikelola via tabel `feature_flags` di Supabase; hasil di-cache Redis (TTL 60 detik); env var `FEATURE_*` mengoverride semua nilai dari DB; kill switch aktif dalam < 60 detik
- **FR-15:** DAU dan MAU dihitung via Upstash Redis HyperLogLog (`PFADD`/`PFCOUNT`) — deduplicated tanpa menyimpan data pribadi; event raw disimpan di tabel `site_events`

---

## Database Schema (Supabase — Tabel Baru)

```sql
-- Extend Supabase Auth users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  twitter TEXT,
  github TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'maker', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produk yang disubmit maker
CREATE TABLE submitted_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  tagline TEXT NOT NULL CHECK (char_length(tagline) <= 60),
  description TEXT,
  live_url TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected')),
  rejection_reason TEXT,
  is_sponsored BOOLEAN DEFAULT FALSE,
  sponsored_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  site_id UUID REFERENCES submitted_sites(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES submitted_sites(id),
  user_id UUID REFERENCES profiles(id),
  parent_id UUID REFERENCES comments(id), -- NULL = top-level
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE potd_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES submitted_sites(id),
  date DATE NOT NULL UNIQUE,
  vote_count INT NOT NULL
);

CREATE TABLE site_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES submitted_sites(id),
  event_type TEXT CHECK (event_type IN ('view', 'click')),
  referrer TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id),
  reporter_id UUID REFERENCES profiles(id),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  store_slug TEXT NOT NULL,
  xendit_invoice_id TEXT,
  amount INT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags
CREATE TABLE feature_flags (
  flag_name   TEXT PRIMARY KEY,
  enabled     BOOLEAN DEFAULT FALSE,
  rollout_pct INT DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  whitelist   UUID[] DEFAULT '{}',
  env         TEXT DEFAULT 'all' CHECK (env IN ('all', 'prod', 'staging', 'dev')),
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES profiles(id)
);

-- Seed 12 flags awal
INSERT INTO feature_flags (flag_name, enabled, rollout_pct, description) VALUES
  ('upvote',               true,  100, 'Sistem upvote di SiteCard'),
  ('comments',             true,  100, 'Komentar di halaman site detail'),
  ('leaderboard',          true,  100, 'Halaman /leaderboard'),
  ('potd',                 true,  100, 'Product of the Day di homepage'),
  ('sponsored_listing',    false, 0,   'Sponsored placement via Xendit'),
  ('store_xendit',         false, 0,   'Store checkout via Xendit'),
  ('maker_analytics',      false, 0,   'Dashboard analytics untuk maker'),
  ('newsletter_subscribe', false, 0,   'Form subscribe newsletter'),
  ('search_supabase_fts',  false, 10,  'Supabase FTS canary rollout'),
  ('auto_approve',         true,  100, 'Auto-approve produk jika URL valid'),
  ('potd_email',           true,  100, 'Email notifikasi POTD ke maker'),
  ('comment_rate_limit',   true,  100, 'Rate limiting komentar via Redis');
```

---

## Non-Goals (Out of Scope MVP)

- ❌ Rebuild komponen UI yang sudah ada (Button, Text, Wrapper, Navigation, dll.)
- ❌ Ganti Fuse.js search untuk content static
- ❌ Aplikasi mobile native (iOS/Android)
- ❌ Auto-renewal sponsored listing
- ❌ Rich text editor untuk komentar
- ❌ Nested komentar lebih dari 1 level
- ❌ Direct message antar pengguna
- ❌ API publik untuk third party
- ❌ Multi-bahasa selain Indonesia & Inggris

---

## Design Considerations

- **Pakai komponen existing:** Semua UI baru wajib gunakan `Button`, `Text`, `Wrapper` — jangan buat duplikat
- **Extend, jangan replace:** `SiteCard`, `SponsorCard`, `SitesPreview` di-extend, bukan di-rebuild
- **Astro Islands:** Komponen interaktif (vote button, komentar form, filter tab) gunakan Astro Islands (Preact/Vanilla JS)
- **BaseLayout props:** Gunakan `hideNavigation`/`hideFooter` untuk halaman auth; `showSearch` sesuai kebutuhan
- **Referensi design system:** `src/pages/system/` (colors, typography, buttons) sebagai acuan visual

---

## Sprint Order

### Sprint 1 — Foundation (1 minggu)
```
├── US-001: Fix RSS Feed                    [30 menit]
├── US-002: Auth Backend                    [2-3 hari]
│   ├── Setup Supabase project + env vars
│   ├── Install @supabase/ssr
│   ├── Buat src/middleware.ts
│   ├── Connect signin.astro & signup.astro
│   └── Update Navigation.astro (avatar dropdown)
├── US-013: Feature Flags setup             [1 hari]
│   ├── Buat tabel feature_flags + seed data
│   ├── Buat src/lib/flags.ts
│   └── Buat /admin/flags.astro (UI toggle)
└── Setup semua tabel database schema (termasuk feature_flags)
```

### Sprint 2 — Core Features (1,5 minggu)
```
├── US-003: Submit Handler
├── US-004: Upvote pada SiteCard
├── US-012: Admin Panel (approve/reject)
└── US-007: SitesPreview filter tab + dynamic data
```

### Sprint 3 — Engagement (1 minggu)
```
├── US-005: Komentar & tracking di site detail
├── US-006: User Dashboard (/dashboard/*)
├── US-008: Product of the Day
└── US-009: Leaderboard page
```

### Sprint 4 — Monetisasi & Analytics (1,5 minggu)
```
├── US-010: Advertise / Sponsored Listing (Xendit)
├── US-011: Store Checkout (Xendit)
└── US-014: Analytics System
    ├── src/lib/analytics.ts
    ├── /admin/analytics.astro (platform analytics)
    └── /dashboard/analytics/[siteId].astro (maker analytics, expand dari US-006)
```

### Sprint 5 — Polish (3-4 hari)
```
├── Redis caching audit
├── Email templates Resend
├── OG tags per site (SEO)
└── End-to-end testing
```

---

## Success Metrics

| Metrik | Target (3 Bulan Pertama) |
|---|---|
| Produk terdaftar (approved) | > 200 produk |
| Pengguna terdaftar | > 5.000 user |
| Monthly Active Users (MAU) | > 2.000 |
| Avg. votes per produk | > 15 votes |
| Avg. session duration | > 3 menit |
| Sponsored listing terjual | > 5 slot/bulan |
| RSS subscriber | > 500 |
| Uptime | > 99.5% |
| DAU / MAU Ratio | > 20% (healthy retention) |
| Feature flag kill switch response | < 60 detik |
| Analytics data freshness | < 5 menit lag |

---

## Keputusan Desain (ADR — Architecture Decision Records)

| # | Topik | Keputusan | Alasan |
|---|---|---|---|
| ADR-001 | Kurasi Produk | **Auto-approve** jika URL live valid (HTTP 200) + thumbnail terupload; jika gagal → `pending_review` manual | Mengurangi beban admin; produk berkualitas langsung tayang |
| ADR-002 | Store `checkout` field | **Dihapus** setelah Xendit live dan semua produk store sudah diuji | Mengurangi technical debt; Xendit menjadi satu-satunya payment flow |
| ADR-003 | Search Engine | **Supabase full-text search** (`tsvector`) untuk semua konten; Fuse.js tetap sebagai UI layer (debounce/instant feel) tapi data dari Supabase | Gratis (termasuk dalam Supabase free tier), satu source of truth, tidak ada dual-index maintenance |
| ADR-004 | Username | **Auto-generate** dari email saat signup (slug dari local-part email + suffix jika konflik); user **bisa ganti** kapan saja via settings | UX smooth saat onboarding; tidak memblok signup flow |
| ADR-005 | Cron Engine | **Cloudflare Workers Cron Triggers** jika deploy di Cloudflare Pages; **Supabase pg_cron** sebagai fallback untuk Vercel/Netlify | Cloudflare Workers free tier sudah cukup (100K req/hari); tidak butuh layanan cron tambahan |
| ADR-006 | Feature Flags Storage | **Supabase tabel** `feature_flags` + Redis cache (TTL 60 detik) — bukan layanan eksternal seperti LaunchDarkly | Zero cost tambahan; sudah punya Supabase dan Redis; cukup untuk skala MVP |
| ADR-007 | Analytics Tracking | **Server-side only** via Astro SSR + Upstash Redis HyperLogLog untuk DAU/MAU — tidak ada client-side script | Tidak diblok ad-blocker; akurasi lebih tinggi; tidak perlu izin cookie consent untuk HyperLogLog (tidak simpan PII) |