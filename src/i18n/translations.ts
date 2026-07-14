/**
 * Kukode i18n dictionaries.
 *
 * Supported locales: en (English), id (Bahasa Indonesia),
 *                    bjn (Bahasa Banjar), jv (Basa Jawa), ms (Bahasa Melayu).
 *
 * NOTE: bjn / jv / ms translations are approximate — they need native-speaker
 * review before being treated as production-grade. The runtime falls back to
 * `defaultLang` (English) for any missing key, so partial coverage is safe.
 */

export const languages = {
  en: 'English',
  id: 'Bahasa Indonesia',
  bjn: 'Bahasa Banjar',
  jv: 'Basa Jawa',
  ms: 'Bahasa Melayu',
};

export const defaultLang = 'en';

// ISO codes accepted by middleware (?lang=... and `preferred_lang` cookie/db).
// Keep in sync with the keys of `languages` above.
export const supportedLangCodes = ['en', 'id', 'bjn', 'jv', 'ms'] as const;

export const ui = {
  en: {
    // Navigation
    'nav.overview': 'Overview',
    'nav.websites': 'Websites',
    'nav.pricing': 'Pricing',
    'nav.blog': 'Blog',
    'nav.store': 'Store',
    'nav.submit': 'Submit',
    'nav.sponsors': 'Sponsors',
    'nav.buyKukode': 'Buy Kukode',
    'nav.leaderboard': 'Leaderboard',
    'nav.signin': 'Sign in',
    'nav.signup': 'Sign up',
    'nav.signout': 'Sign out',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Settings',
    'nav.admin': 'Admin Panel',

    // Footer
    'footer.stayConnected': 'Stay connected to the future of Kukode',
    'footer.subscribe': 'Subscribe',
    'footer.emailPlaceholder': 'you@example.com',

    // Auth Pages
    'auth.signinTitle': 'Sign in to Kukode',
    'auth.signupTitle': 'Create your account',
    'auth.emailLabel': 'Email address',
    'auth.passwordLabel': 'Password',
    'auth.usernameLabel': 'Username',
    'auth.fullNameLabel': 'Full Name',
    'auth.haveAccount': 'Already have an account?',
    'auth.noAccount': "Don't have an account?",
    'auth.signinButton': 'Sign in',
    'auth.signupButton': 'Create Account',
    'auth.submitting': 'Please wait...',

    // About Page
    'about.title': 'What is Kukode?',
    'about.desc':
      'Kukode is a curated directory of production-grade websites, design systems, and Astro/HTML templates — reviewed by editors and curated for designers and developers.',
    'about.p1':
      'Kukode is a curated directory of production-grade websites, design systems, and Astro/HTML templates built for designers, developers, and creative professionals who want to benchmark real-world work — not concept art. Every listing on Kukode links to a live, publicly accessible site or product that has been editorially reviewed before publication. The platform combines three artifacts: a public product directory with a daily site-of-the-day rotation, a community-driven voting and leaderboard system, and a storefront for premium templates and digital products. Submissions are open via the /submit page and reviewed by the Kukode editorial team within seven days. The site is available in five languages — English, Indonesian, Banjar, Javanese, and Malay — and runs on Cloudflare Workers for sub-100ms response times globally. Kukode does not list concept work, lorem-ipsum placeholders, sites without a public URL, or products that fail the editorial accessibility audit.',
    'about.p2':
      'Beyond the directory, Kukode ships in-depth articles on typography, design systems, and front-end tooling under /blog/. Members can vote products up or down, follow specific makers, and subscribe to a weekly newsletter. Curated collections, focused tutorials, and trend breakdowns are built to improve decision-making — not just inspire it.',
    'about.p3':
      'Kukode does not accept sponsorships to surface listings higher, and editorial reviews are independent of paid placements. The platform is open source at its core and welcomes pull requests for translations, accessibility improvements, and new topic coverage.',
    'about.quote': '',
    'about.author': 'The Kukode editorial team',

    // Advertise Page
    'adv.title': 'Put your launch in front of the Kukode crowd',
    'adv.subtitle':
      'Reach designers and developers actively looking for production-grade inspiration. Choose a package or build a custom campaign.',
    'adv.pkg1Name': 'Sponsored Article',
    'adv.pkg1Price': '$899',
    'adv.pkg1Desc':
      'A bespoke write-up on Kukode that shows your product in context. Great for launches that need instant credibility.',
    'adv.pkg2Name': 'Newsletter Ad',
    'adv.pkg2Price': '$1,299',
    'adv.pkg2Desc':
      'Secure ad space in our weekly newsletter. Reach a curated audience of designers and builders looking for production tools.',
    'adv.features': 'Included features:',

    // Pricing Page
    'pricing.title': 'Simple, transparent pricing',
    'pricing.subtitle':
      'Choose the plan that fits your workflow. All plans include lifetime updates and premium support.',
    'pricing.monthly': 'Monthly billing',
    'pricing.yearly': 'Yearly billing (Save 20%)',
    'pricing.starterName': 'Starter',
    'pricing.starterPrice': '$19',
    'pricing.starterDesc':
      'Essential features for designers, software developers, and creators starting out.',
    'pricing.proName': 'Pro',
    'pricing.proPrice': '$49',
    'pricing.proDesc': 'Perfect for professional developers, teams, and high-growth makers.',
    'pricing.features': 'All plans include:',
    'pricing.choosePlan': 'Choose Plan',

    // Submit Page
    'submit.title': 'Submit your creation',
    'submit.subtitle':
      'Share your modern web projects, CSS resources, or Astro templates with the global developer community.',
    'submit.nameLabel': 'Product Name',
    'submit.taglineLabel': 'Tagline',
    'submit.descLabel': 'Short Description',
    'submit.urlLabel': 'Live URL',
    'submit.thumbLabel': 'Thumbnail URL',
    'submit.tagsLabel': 'Tags (comma separated)',
    'submit.button': 'Submit Product',

    // Hero / Previews
    'hero.titleLine1': 'No concepts.',
    'hero.titleLine2': 'Just real websites.',
    'hero.cta': 'Get Started',
    'hero.desc':
      'A curated collection of production websites worth studying — layout, hierarchy, interaction, and execution. Use them to benchmark your own work, not to copy it.',
    'sites.allTags': 'All Tags',
    'sites.terbaru': 'Terbaru',
    'sites.populer': 'Populer',
    'sites.showMore': 'Show more',
    'blog.latestArticles': 'Latest articles',
    'blog.seeAllArticles': 'See all articles',
    'blog.latestPosts': 'Latest posts',
    'blog.seeAllPosts': 'See all posts',
    'store.latestTemplates': 'Our latest templates',
    'store.seeThemAll': 'See them all!',
    'store.moreProducts': 'More products',
    'store.seeAllProducts': 'See all products',

    // Store Pages
    'store.seoTitle': 'Templates & Products',
    'store.seoDesc':
      'Shop our premium curation of digital developer products and HTML/Astro templates.',
    'store.title': 'Our products',
    'store.desc':
      'Shop my selection of digital products to help you grow your business, and to make your life easier and more productive',
    'store.paymentSuccess': 'Payment Successful!',
    'store.paymentSuccessDesc':
      'Thank you for your purchase. You will receive a receipt and details shortly via email.',
    'store.paymentFailed': 'Payment Failed or Cancelled',
    'store.paymentFailedDesc':
      'The checkout process was not completed. Please try again if this was a mistake.',

    // Dashboard
    'dashboard.welcome': 'Welcome back,',
    'dashboard.submitted': 'Submitted Products',
    'dashboard.approved': 'Approved',
    'dashboard.totalVotes': 'Total Votes',
    'dashboard.totalViews': 'Total Views',
    'dashboard.emptyTitle': 'No products submitted yet',
    'dashboard.emptyDesc':
      "You haven't submitted any products yet. Submit your first product now to get exposure!",
    'dashboard.emptyAction': 'Submit First Product',
    'dashboard.myProducts': 'My Products',
    'dashboard.manageSubmissions':
      'Manage your submissions and track their performance.',
    'dashboard.submitNewProduct': 'Submit New Product',
    'dashboard.viewPage': 'View Page',
    'dashboard.analytics': 'Analytics',
    'dashboard.awaitingApproval': 'Awaiting Approval',
    'dashboard.submissionRejected': 'Submission Rejected',
    'dashboard.pendingReview': 'Pending Review',
    'dashboard.rejected': 'Rejected',
    'dashboard.submittedOn': 'Submitted on ',
    'dashboard.rejectionReason': 'Rejection Reason:',

    // Leaderboard
    'leaderboard.title': 'Leaderboard',
    'leaderboard.description': 'Top voted sites on Kukode.',
    'leaderboard.discover':
      'Discover the most upvoted sites built by the developer community.',
    'leaderboard.weekly': 'Weekly',
    'leaderboard.monthly': 'Monthly',
    'leaderboard.allTime': 'All-Time',
    'leaderboard.empty': 'No products have been upvoted yet.',
    'leaderboard.votes': 'Votes',

    // Settings
    'settings.usernameUsed': 'Username already taken. Choose another username.',
    'settings.successUpdate': 'Profile updated successfully!',
    'settings.failUpdate': 'Failed to update profile.',
    'settings.bioPlaceholder': 'Tell us a little about yourself...',
    'settings.saveChanges': 'Save Changes',
    'settings.fullName': 'Full Name',
    'settings.bio': 'Bio',
    'settings.website': 'Website',
    'settings.avatarLabel': 'Profile Picture',
    'settings.avatarHelp': 'Format JPEG, PNG, or WebP. Max size 2MB.',
    'settings.passkeysTitle': 'Passkeys & Biometric Security',
    'settings.passkeysDesc':
      'Passkeys allow you to sign in securely using your fingerprint, face scan, or device PIN, without typing a password.',
    'settings.noPasskeys': 'No passkeys registered yet.',
    'settings.passkeyCreated': 'Created on',
    'settings.passkeyRemove': 'Remove',
    'settings.passkeyRegister': 'Register new passkey',
    'settings.passkeyGenerating': 'Generating options...',
    'settings.passkeyWaiting': 'Waiting for authenticator...',
    'settings.passkeyFailedCreate': 'Failed to create credential',
    'settings.passkeyVerifying': 'Verifying...',
    'settings.passkeyRegistered':
      'Passkey registered successfully! Refreshing...',
    'settings.passkeyRegistrationFailed': 'Registration failed',
    'settings.passkeyRemoved': 'Passkey removed successfully',
    'settings.passkeyRemoveTitle': 'Remove Passkey',
    'settings.passkeyRemoveMessage':
      'Are you sure you want to remove this passkey? You will no longer be able to use it to sign in.',
    'settings.uploadingAvatar': 'Uploading Avatar...',
    'settings.usernameInvalid':
      'Username can only contain letters, numbers, hyphens, and underscores.',
    'settings.websiteInvalid':
      'Website URL must start with http:// or https://',
    'settings.avatarTooLarge': 'Avatar size must be less than 2MB.',
    'settings.avatarNotImage': 'Avatar must be an image file.',

    // Common (used in JS-driven modals/toasts)
    'common.areYouSure': 'Are you sure?',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',

    // Rate limit (used by middleware)
    'rateLimit.tooMany': 'Too many requests. Please try again later.',

    // Command palette (cmdk-style)
    'cmdk.open': 'Open command palette',
    'cmdk.search': 'Search Kukode…',
    'cmdk.searchPlaceholder': 'Search pages, posts, sites, products…',
    'cmdk.noResults': 'No results found.',
    'cmdk.typePage': 'Page',
    'cmdk.typePost': 'Post',
    'cmdk.typeSite': 'Site',
    'cmdk.typeStore': 'Product',
    'cmdk.hintNavigate': 'navigate',
    'cmdk.hintSelect': 'select',
    'cmdk.hintClose': 'close',
    'cmdk.kbd': '⌘K',

    // Comments (DisqusClone.jsx)
    'comments.countTitle': '{count} Comments',
    'comments.composerPlaceholder': 'Share your thoughts…',
    'comments.send': 'Post',
    'comments.reply': 'Reply',
    'comments.replyPlaceholder': 'Reply to {name}…',
    'comments.upvote': 'Upvote',
    'comments.report': 'Report',
    'comments.share': 'Share',
    'comments.hideReplies': 'Hide replies',
    'comments.showReplies': 'Show replies',
    'comments.showMore': 'Show more',
    'comments.maker': 'Maker',
    'comments.timeAgo.justNow': 'just now',
    'comments.timeAgo.minutes': '{n}m ago',
    'comments.timeAgo.hours': '{n}h ago',
    'comments.timeAgo.days': '{n}d ago',
  },
  id: {
    // Navigation
    'nav.overview': 'Ikhtisar',
    'nav.websites': 'Situs Web',
    'nav.pricing': 'Harga',
    'nav.blog': 'Blog',
    'nav.store': 'Toko',
    'nav.submit': 'Kirim',
    'nav.sponsors': 'Sponsor',
    'nav.buyKukode': 'Beli Kukode',
    'nav.leaderboard': 'Papan Peringkat',
    'nav.signin': 'Masuk',
    'nav.signup': 'Daftar',
    'nav.signout': 'Keluar',
    'nav.dashboard': 'Dasbor',
    'nav.settings': 'Pengaturan',
    'nav.admin': 'Panel Admin',

    // Footer
    'footer.stayConnected': 'Tetap terhubung dengan masa depan Kukode',
    'footer.subscribe': 'Langganan',
    'footer.emailPlaceholder': 'kamu@contoh.com',

    // Auth Pages
    'auth.signinTitle': 'Masuk ke Kukode',
    'auth.signupTitle': 'Buat akun baru',
    'auth.emailLabel': 'Alamat email',
    'auth.passwordLabel': 'Kata sandi',
    'auth.usernameLabel': 'Nama pengguna',
    'auth.fullNameLabel': 'Nama Lengkap',
    'auth.haveAccount': 'Sudah punya akun?',
    'auth.noAccount': 'Belum punya akun?',
    'auth.signinButton': 'Masuk',
    'auth.signupButton': 'Daftar Akun',
    'auth.submitting': 'Mohon tunggu...',

    // About Page
    'about.title': 'Apa itu Kukode?',
    'about.desc':
      'Kukode adalah direktori terkurasi berisi situs web, sistem desain, dan templat Astro/HTML tingkat produksi — ditinjau oleh redaksi dan dikurasi untuk desainer serta pengembang.',
    'about.p1':
      'Kukode adalah direktori terkurasi berisi situs web, sistem desain, dan templat Astro/HTML tingkat produksi yang dibuat untuk desainer, pengembang, dan profesional kreatif yang ingin menilai karya nyata — bukan konsep abstrak. Setiap entri di Kukode tertaut ke situs atau produk yang dapat diakses publik dan telah ditinjau secara editorial sebelum dipublikasikan. Platform ini menggabungkan tiga hal: direktori produk publik dengan rotasi situs harian, sistem voting dan papan peringkat berbasis komunitas, serta toko untuk templat premium dan produk digital. Pengajuan terbuka melalui halaman /submit dan ditinjau oleh tim redaksi Kukode dalam tujuh hari. Situs tersedia dalam lima bahasa — Inggris, Indonesia, Banjar, Jawa, dan Melayu — dan berjalan di Cloudflare Workers dengan waktu respons global di bawah 100ms. Kukode tidak memuat karya konsep, placeholder lorem-ipsum, situs tanpa URL publik, atau produk yang gagal dalam tinjauan aksesibilitas editorial.',
    'about.p2':
      'Selain direktori, Kukode menerbitkan artikel mendalam tentang tipografi, sistem desain, dan perkakas front-end di /blog/. Anggota dapat memberikan suara untuk produk, mengikuti maker tertentu, dan berlangganan newsletter mingguan. Koleksi terkurasi, tutorial terfokus, dan rincian tren dirancang untuk meningkatkan pengambilan keputusan — bukan sekadar menginspirasi.',
    'about.p3':
      'Kukode tidak menerima sponsorship untuk menampilkan listing lebih tinggi, dan tinjauan redaksi bersifat independen dari pemasangan berbayar. Platform ini bersifat open source dan menerima pull request untuk terjemahan, peningkatan aksesibilitas, dan topik baru.',
    'about.quote': '',
    'about.author': 'Tim redaksi Kukode',

    // Advertise Page
    'adv.title': 'Tempatkan peluncuran Anda di depan audiens Kukode',
    'adv.subtitle':
      'Jangkau desainer dan pengembang yang aktif mencari inspirasi tingkat produksi. Pilih paket atau buat kampanye khusus.',
    'adv.pkg1Name': 'Artikel Sponsor',
    'adv.pkg1Price': 'Rp899.000',
    'adv.pkg1Desc':
      'Ulasan khusus tentang Kukode yang menampilkan produk Anda dalam konteksnya. Sangat cocok untuk peluncuran yang membutuhkan kredibilitas instan.',
    'adv.pkg2Name': 'Iklan Newsletter',
    'adv.pkg2Price': 'Rp1.299.000',
    'adv.pkg2Desc':
      'Amankan ruang iklan di newsletter mingguan kami. Jangkau audiens desainer dan pembangun terkurasi yang mencari alat produksi.',
    'adv.features': 'Fitur yang didapatkan:',

    // Pricing Page
    'pricing.title': 'Harga yang sederhana dan transparan',
    'pricing.subtitle':
      'Pilih paket yang sesuai dengan alur kerja Anda. Semua paket menyertakan pembaruan seumur hidup dan dukungan premium.',
    'pricing.monthly': 'Tagihan bulanan',
    'pricing.yearly': 'Tagihan tahunan (Hemat 20%)',
    'pricing.starterName': 'Starter',
    'pricing.starterPrice': 'Rp299.000',
    'pricing.starterDesc':
      'Fitur penting untuk desainer, pengembang perangkat lunak, dan pembuat konten pemula.',
    'pricing.proName': 'Pro',
    'pricing.proPrice': 'Rp799.000',
    'pricing.proDesc':
      'Sangat cocok untuk pengembang profesional, tim, dan pembuat produk dengan pertumbuhan tinggi.',
    'pricing.features': 'Semua paket termasuk:',
    'pricing.choosePlan': 'Pilih Paket',

    // Submit Page
    'submit.title': 'Kirimkan kreasi Anda',
    'submit.subtitle':
      'Bagikan proyek web modern, sumber daya CSS, atau templat Astro Anda dengan komunitas pengembang global.',
    'submit.nameLabel': 'Nama Produk',
    'submit.taglineLabel': 'Tagline',
    'submit.descLabel': 'Deskripsi Singkat',
    'submit.urlLabel': 'URL Live',
    'submit.thumbLabel': 'URL Miniatur',
    'submit.tagsLabel': 'Tag (pisahkan dengan koma)',
    'submit.button': 'Kirim Produk',

    // Hero / Previews
    'hero.titleLine1': 'Bukan konsep.',
    'hero.titleLine2': 'Hanya situs web nyata.',
    'hero.cta': 'Mulai Sekarang',
    'hero.desc':
      'Kumpulan situs web produksi pilihan yang layak dipelajari — tata letak, hierarki, interaksi, dan eksekusi. Gunakan untuk tolok ukur karya Anda, bukan menirunya.',
    'sites.allTags': 'Semua Tag',
    'sites.terbaru': 'Terbaru',
    'sites.populer': 'Populer',
    'sites.showMore': 'Tampilkan lebih banyak',
    'blog.latestArticles': 'Artikel terbaru',
    'blog.seeAllArticles': 'Lihat semua artikel',
    'blog.latestPosts': 'Postingan terbaru',
    'blog.seeAllPosts': 'Lihat semua postingan',
    'store.latestTemplates': 'Templat terbaru kami',
    'store.seeThemAll': 'Lihat semua!',
    'store.moreProducts': 'Produk lainnya',
    'store.seeAllProducts': 'Lihat semua produk',

    // Store Pages
    'store.seoTitle': 'Templat & Produk',
    'store.seoDesc':
      'Belanja pilihan templat HTML/Astro dan produk developer digital premium kami.',
    'store.title': 'Produk kami',
    'store.desc':
      'Beli pilihan produk digital kami untuk membantu mengembangkan bisnis Anda dan membuat hidup Anda lebih mudah serta produktif',
    'store.paymentSuccess': 'Pembayaran Berhasil!',
    'store.paymentSuccessDesc':
      'Terima kasih atas pembelian Anda. Rincian produk akan segera dikirimkan ke email Anda.',
    'store.paymentFailed': 'Pembayaran Gagal atau Dibatalkan',
    'store.paymentFailedDesc':
      'Proses checkout tidak selesai. Silakan coba kembali.',

    // Dashboard
    'dashboard.welcome': 'Selamat datang kembali,',
    'dashboard.submitted': 'Produk Submitted',
    'dashboard.approved': 'Disetujui',
    'dashboard.totalVotes': 'Total Polling',
    'dashboard.totalViews': 'Total Dilihat',
    'dashboard.emptyTitle': 'Belum ada produk yang disubmit',
    'dashboard.emptyDesc':
      'Kamu belum mensubmit produk apa pun. Submit produk pertamamu sekarang untuk mendapatkan eksposur!',
    'dashboard.emptyAction': 'Submit Produk Pertama',
    'dashboard.myProducts': 'Produk Saya',
    'dashboard.manageSubmissions':
      'Kelola kiriman produk Anda dan pantau performanya.',
    'dashboard.submitNewProduct': 'Kirim Produk Baru',
    'dashboard.viewPage': 'Lihat Halaman',
    'dashboard.analytics': 'Analitik',
    'dashboard.awaitingApproval': 'Menunggu Persetujuan',
    'dashboard.submissionRejected': 'Pengiriman Ditolak',
    'dashboard.pendingReview': 'Menunggu Peninjauan',
    'dashboard.rejected': 'Ditolak',
    'dashboard.submittedOn': 'Dikirim pada ',
    'dashboard.rejectionReason': 'Alasan Penolakan:',

    // Leaderboard
    'leaderboard.title': 'Papan Peringkat',
    'leaderboard.description': 'Situs web terpopuler dengan upvote terbanyak di Kukode.',
    'leaderboard.discover':
      'Temukan produk-produk paling populer yang dikurasi oleh komunitas pengembang.',
    'leaderboard.weekly': 'Mingguan',
    'leaderboard.monthly': 'Bulanan',
    'leaderboard.allTime': 'Sepanjang Masa',
    'leaderboard.empty': 'Belum ada produk yang mendapatkan upvote.',
    'leaderboard.votes': 'Suara',

    // Settings
    'settings.usernameUsed': 'Username sudah digunakan. Pilih username lain.',
    'settings.successUpdate': 'Profil berhasil diperbarui!',
    'settings.failUpdate': 'Gagal memperbarui profil.',
    'settings.bioPlaceholder': 'Ceritakan sedikit tentang dirimu...',
    'settings.saveChanges': 'Simpan Perubahan',
    'settings.fullName': 'Nama Lengkap',
    'settings.bio': 'Bio',
    'settings.website': 'Situs Web',
    'settings.avatarLabel': 'Foto Profil',
    'settings.avatarHelp': 'Format JPEG, PNG, atau WebP. Maksimal 2MB.',
    'settings.passkeysTitle': 'Passkey & Keamanan Biometrik',
    'settings.passkeysDesc':
      'Passkey memungkinkan Anda masuk dengan aman menggunakan sidik jari, pemindai wajah, atau PIN perangkat, tanpa mengetik sandi.',
    'settings.noPasskeys': 'Belum ada passkey yang terdaftar.',
    'settings.passkeyCreated': 'Dibuat pada',
    'settings.passkeyRemove': 'Hapus',
    'settings.passkeyRegister': 'Daftarkan passkey baru',
    'settings.passkeyGenerating': 'Membuat opsi...',
    'settings.passkeyWaiting': 'Menunggu autentikator...',
    'settings.passkeyFailedCreate': 'Gagal membuat kredensial',
    'settings.passkeyVerifying': 'Memverifikasi...',
    'settings.passkeyRegistered':
      'Passkey berhasil didaftarkan! Menyegarkan...',
    'settings.passkeyRegistrationFailed': 'Registrasi gagal',
    'settings.passkeyRemoved': 'Passkey berhasil dihapus',
    'settings.passkeyRemoveTitle': 'Hapus Passkey',
    'settings.passkeyRemoveMessage':
      'Apakah Anda yakin ingin menghapus passkey ini? Anda tidak akan dapat menggunakannya lagi untuk masuk.',
    'settings.uploadingAvatar': 'Mengunggah Avatar...',
    'settings.usernameInvalid':
      'Username hanya boleh berisi huruf, angka, tanda hubung, dan garis bawah.',
    'settings.websiteInvalid': 'URL website harus dimulai dengan http:// atau https://',
    'settings.avatarTooLarge': 'Ukuran avatar harus kurang dari 2MB.',
    'settings.avatarNotImage': 'Avatar harus berupa berkas gambar.',

    // Common
    'common.areYouSure': 'Apakah Anda yakin?',
    'common.confirm': 'Konfirmasi',
    'common.cancel': 'Batal',

    // Rate limit
    'rateLimit.tooMany': 'Terlalu banyak permintaan. Silakan coba beberapa saat lagi.',

    // Command palette (cmdk-style)
    'cmdk.open': 'Buka palet perintah',
    'cmdk.search': 'Cari di Kukode…',
    'cmdk.searchPlaceholder': 'Cari halaman, artikel, situs, produk…',
    'cmdk.noResults': 'Tidak ada hasil.',
    'cmdk.typePage': 'Halaman',
    'cmdk.typePost': 'Artikel',
    'cmdk.typeSite': 'Situs',
    'cmdk.typeStore': 'Produk',
    'cmdk.hintNavigate': 'navigasi',
    'cmdk.hintSelect': 'pilih',
    'cmdk.hintClose': 'tutup',
    'cmdk.kbd': '⌘K',

    // Comments
    'comments.countTitle': '{count} Komentar',
    'comments.composerPlaceholder': 'Bagikan pendapatmu…',
    'comments.send': 'Kirim',
    'comments.reply': 'Balas',
    'comments.replyPlaceholder': 'Balas ke {name}…',
    'comments.upvote': 'Upvote',
    'comments.report': 'Laporkan',
    'comments.share': 'Bagikan',
    'comments.hideReplies': 'Sembunyikan balasan',
    'comments.showReplies': 'Tampilkan balasan',
    'comments.showMore': 'Tampilkan lebih banyak',
    'comments.maker': 'Maker',
    'comments.timeAgo.justNow': 'baru saja',
    'comments.timeAgo.minutes': '{n}m lalu',
    'comments.timeAgo.hours': '{n}j lalu',
    'comments.timeAgo.days': '{n}h lalu',
  },
  bjn: {
    // Navigation — Banjar (Kalimantan Selatan). Approximate; needs native review.
    'nav.overview': 'Tinjauan',
    'nav.websites': 'Situs Web',
    'nav.pricing': 'Harga',
    'nav.blog': 'Blog',
    'nav.store': 'Toko',
    'nav.submit': 'Kirim',
    'nav.sponsors': 'Sponsor',
    'nav.buyKukode': 'Beli Kukode',
    'nav.leaderboard': 'Papan Pungutan',
    'nav.signin': 'Asup',
    'nav.signup': 'Mendaftar',
    'nav.signout': 'Kaluar',
    'nav.dashboard': 'Dasbor',
    'nav.settings': 'Pangaturan',
    'nav.admin': 'Panel Admin',

    // Footer
    'footer.stayConnected': 'Tetap talawai dengan masa depan Kukode',
    'footer.subscribe': 'Langganan',
    'footer.emailPlaceholder': 'kawan@conto.com',

    // Auth Pages
    'auth.signinTitle': 'Asup ka Kukode',
    'auth.signupTitle': 'Jadi akun baru',
    'auth.emailLabel': 'Alamat email',
    'auth.passwordLabel': 'Kata sandi',
    'auth.usernameLabel': 'Nama pengguna',
    'auth.fullNameLabel': 'Nama Lengkap',
    'auth.haveAccount': 'Sudah punya akun?',
    'auth.noAccount': 'Balum punya akun?',
    'auth.signinButton': 'Asup',
    'auth.signupButton': 'Daftar Akun',
    'auth.submitting': 'Dumai sakalawai...',

// About Page — Banjar. Approximate; needs native review.
    'about.title': 'Apa itu Kukode?',
    'about.desc':
      'Kukode ialah direktori nang dikurasi, berisi situs web, sistem desain, wan templat Astro/HTML tingkat produksi — ditinjau redaksi wan dikurasi untuk desainer wan pangambang.',
    'about.p1':
      'Kukode ialah direktori nang dikurasi, berisi situs web, sistem desain, wan templat Astro/HTML tingkat produksi nang dirancang untuk desainer, pangambang, wan profesional kreatif nang handak menilai karya nyata — bukan konsep abstrak. Saban entri di Kukode baisi tautan ka situs atawa produk nang kawa diakses publik wan sudah ditinjau sacara éditorial sabalum dipublikasikan. Platform ini mahabungan tiga hal: direktori produk publik lawan rotasi situs harian, sistem voting wan papan paringkat basasis komunitas, serta toko untuk templat premium wan produk digital. Pangajuan tarbuka lewat halaman /submit wan ditinjau ulih tim redaksi Kukode dalam tujuh hari. Situs tasadia dalam lima bahasa — Inggris, Indonesia, Banjar, Jawa, wan Melayu — wan bajalan di Cloudflare Workers lawan waktu respons global di bawah 100ms. Kukode kada mamuat karya konsep, placeholder lorem-ipsum, situs tanpa URL publik, atawa produk nang gagal dalam tinjauan aksesibilitas éditorial.',
    'about.p2':
      'Salinggan direktori, Kukode maartikel dalam tantang tipografi, sistem desain, wan pakakas front-end di /blog/. Angguta kawa mambari suara gasan produk, maikuti maker tartantu, wan barlangganan newsletter mingguan. Koleksi nang dikurasi, tutorial tarfokus, wan rincian trend dirancang untuk maningkatkan kaputusan — bukan saia menginspirasi.',
    'about.p3':
      'Kukode kada manarima sponsorship gasan manampilkan listing labih tinggi, wan tinjauan rédaksi bai sifat independén matan pamasaangan barbayar. Platform ini basifat open source wan manarima pull request gasan tarjamahan, paningkataan aksesibilitas, wan topik baharu.',
    'about.quote': '',
    'about.author': 'Tim rédaksi Kukode',

    // Advertise Page
    'adv.title': 'Taruh peluncuran Pian di hadapan audiens Kukode',
    'adv.subtitle':
      'Jangkau desainer dan pangambang nang aktif mancari inspirasi tingkat produksi. Pilih paket atau buat kampanye kusus.',
    'adv.pkg1Name': 'Artikel Sponsor',
    'adv.pkg1Price': 'Rp899.000',
    'adv.pkg1Desc':
      'Ulasan kusus tantang Kukode nang maampilkan produk Pian dalam konteksnya. Amat pas untuk peluncuran nang mabutuhakan kridibilitas instan.',
    'adv.pkg2Name': 'Iklan Newsletter',
    'adv.pkg2Price': 'Rp1.299.000',
    'adv.pkg2Desc':
      'Amanakan ruang iklan di newsletter mingguan kami. Jangkau audiens desainer dan pambangunan nang dikurasi nang mancari alat produksi.',
    'adv.features': 'Fitur nang didapakan:',

    // Pricing Page
    'pricing.title': 'Harga nang sederhana dan transparan',
    'pricing.subtitle':
      'Pilih paket nang sasuai dengan aliran kerja Pian. Samunya paket termasuk pambaruan saumur hidup dan dukungan premium.',
    'pricing.monthly': 'Tagihan bulanan',
    'pricing.yearly': 'Tagihan tahunan (Hemat 20%)',
    'pricing.starterName': 'Starter',
    'pricing.starterPrice': 'Rp299.000',
    'pricing.starterDesc':
      'Fitur panting untuk desainer, pangambang parangkat lunak, dan pambuat konten pamula.',
    'pricing.proName': 'Pro',
    'pricing.proPrice': 'Rp799.000',
    'pricing.proDesc':
      'Sangat cocok untuk pangambang profesional, tim, dan pambuat produk dengan partumbuhan tinggi.',
    'pricing.features': 'Samunya paket termasuk:',
    'pricing.choosePlan': 'Pilih Paket',

    // Submit Page
    'submit.title': 'Kirimkan kreasi Pian',
    'submit.subtitle':
      'Bagikan proyek web modern, sumber daya CSS, atau templat Astro Pian dengan komunitas pangambang global.',
    'submit.nameLabel': 'Nama Produk',
    'submit.taglineLabel': 'Tagline',
    'submit.descLabel': 'Deskripsi Singkat',
    'submit.urlLabel': 'URL Live',
    'submit.thumbLabel': 'URL Miniatur',
    'submit.tagsLabel': 'Tag (pisahakan pakai koma)',
    'submit.button': 'Kirim Produk',

    // Hero / Previews
    'hero.titleLine1': 'Kada konsep.',
    'hero.titleLine2': 'Cuma situs web nyata.',
    'hero.cta': 'Mulai',
    'hero.desc':
      'Kumpulan situs web produksi pilihan nang layak dipalajari — tata letak, hiarki, interaksi, dan eksekusi. Pakai untuk tolok ukur karya Pian, bukan maniru.',
    'sites.allTags': 'Samunya Tag',
    'sites.terbaru': 'Tabaru',
    'sites.populer': 'Popular',
    'sites.showMore': 'Tampilkan labih banyak',
    'blog.latestArticles': 'Artikel tabaru',
    'blog.seeAllArticles': 'Lihat samunya artikel',
    'blog.latestPosts': 'Postingan tabaru',
    'blog.seeAllPosts': 'Lihat samunya postingan',
    'store.latestTemplates': 'Templat tabaru kami',
    'store.seeThemAll': 'Lihat samunya!',
    'store.moreProducts': 'Produk lainnya',
    'store.seeAllProducts': 'Lihat samunya produk',

    // Store Pages
    'store.seoTitle': 'Templat & Produk',
    'store.seoDesc':
      'Balanja pilihan templat HTML/Astro dan produk developer digital premium kami.',
    'store.title': 'Produk kami',
    'store.desc':
      'Beli pilihan produk digital kami untuk mambantu mambangunakan bisnis Pian dan mambuat hidup Pian labih mudah dan produktif',
    'store.paymentSuccess': 'Pembayaran Harhasil!',
    'store.paymentSuccessDesc':
      'Tarima kasih atas pamelian Pian. Rincian produk akan segera dikirim ka email Pian.',
    'store.paymentFailed': 'Pembayaran Gagal atau Dibatalkan',
    'store.paymentFailedDesc':
      'Proses checkout kada salasai. Silakan coba baliak.',

    // Dashboard
    'dashboard.welcome': 'Salamat datang baliak,',
    'dashboard.submitted': 'Produk Dikirim',
    'dashboard.approved': 'Disetujui',
    'dashboard.totalVotes': 'Total Polling',
    'dashboard.totalViews': 'Total Dilihat',
    'dashboard.emptyTitle': 'Balum ada produk nang disubmit',
    'dashboard.emptyDesc':
      'Pian balum ma Submit produk apa pun. Submit produk partama Pian sekarang untuk mandapakan eksposur!',
    'dashboard.emptyAction': 'Submit Produk Pertama',
    'dashboard.myProducts': 'Produk Ulun',
    'dashboard.manageSubmissions':
      'Kelola kiriman produk Pian dan pantau performanya.',
    'dashboard.submitNewProduct': 'Kirim Produk Baru',
    'dashboard.viewPage': 'Lihat Halaman',
    'dashboard.analytics': 'Analitik',
    'dashboard.awaitingApproval': 'Manunggu Parsetujuan',
    'dashboard.submissionRejected': 'Pengiriman Ditolak',
    'dashboard.pendingReview': 'Manunggu Paninjauan',
    'dashboard.rejected': 'Ditolak',
    'dashboard.submittedOn': 'Dikirim pada ',
    'dashboard.rejectionReason': 'Alasan Panolakan:',

    // Leaderboard
    'leaderboard.title': 'Papan Pungutan',
    'leaderboard.description': 'Situs web tarpopuler dengan upvote tarbanayak di Kukode.',
    'leaderboard.discover':
      'Tamuakan produk-produk paling populer nang dikurasi ulih komunitas pangambang.',
    'leaderboard.weekly': 'Mingguan',
    'leaderboard.monthly': 'Bulanan',
    'leaderboard.allTime': 'Sapanjang Masa',
    'leaderboard.empty': 'Balum ada produk nang mandapakan upvote.',
    'leaderboard.votes': 'Suara',

    // Settings
    'settings.usernameUsed': 'Username sudah dipakai. Pilih username lain.',
    'settings.successUpdate': 'Profil barhasil dipabaru!',
    'settings.failUpdate': 'Gagal mambaru profil.',
    'settings.bioPlaceholder': 'Caritakan sadikit tantang Pian...',
    'settings.saveChanges': 'Simpan Parubahan',
    'settings.fullName': 'Nama Lengkap',
    'settings.bio': 'Bio',
    'settings.website': 'Situs Web',
    'settings.avatarLabel': 'Foto Profil',
    'settings.avatarHelp': 'Format JPEG, PNG, atau WebP. Maksimal 2MB.',
    'settings.passkeysTitle': 'Passkey & Kaamanan Biometrik',
    'settings.passkeysDesc':
      'Passkey mamungkinkan Pian masuk dengan aman mamakai sidik jari, pamindai wajah, atau PIN parangkat, tanpa mangetik sandi.',
    'settings.noPasskeys': 'Balum ada passkey nang tadaftar.',
    'settings.passkeyCreated': 'Dibuat pada',
    'settings.passkeyRemove': 'Hapus',
    'settings.passkeyRegister': 'Daftarkan passkey baru',
    'settings.passkeyGenerating': 'Mambuat opsi...',
    'settings.passkeyWaiting': 'Manunggu autentikator...',
    'settings.passkeyFailedCreate': 'Gagal mambuat kridensial',
    'settings.passkeyVerifying': 'Mamverifikasi...',
    'settings.passkeyRegistered':
      'Passkey barhasil didaftarkan! Manyagarkan...',
    'settings.passkeyRegistrationFailed': 'Registrasi gagal',
    'settings.passkeyRemoved': 'Passkey barhasil dihapus',
    'settings.passkeyRemoveTitle': 'Hapus Passkey',
    'settings.passkeyRemoveMessage':
      'Apa Pian yakin handak mahapus passkey ini? Pian kada akan bisa mamakainya lagi untuk masuk.',
    'settings.uploadingAvatar': 'Mangunggah Avatar...',
    'settings.usernameInvalid':
      'Username cuma boleh berisi huruf, angka, tanda hubung, dan garis bawah.',
    'settings.websiteInvalid':
      'URL situs web harus dimulai dengan http:// atau https://',
    'settings.avatarTooLarge': 'Ukuran avatar harus kurang matan 2MB.',
    'settings.avatarNotImage': 'Avatar harus barupa barkas gambar.',

    // Common
    'common.areYouSure': 'Apa Pian yakin?',
    'common.confirm': 'Konfirmasi',
    'common.cancel': 'Batal',

    // Rate limit
    'rateLimit.tooMany': 'Terlalu banyak parmintaan. Silakan coba sakalawai.',

    // Command palette (cmdk-style)
    'cmdk.open': 'Buka palet parintah',
    'cmdk.search': 'Cari di Kukode…',
    'cmdk.searchPlaceholder': 'Cari halaman, artikel, situs, produk…',
    'cmdk.noResults': 'Tidak ada hasil.',
    'cmdk.typePage': 'Halaman',
    'cmdk.typePost': 'Artikel',
    'cmdk.typeSite': 'Situs',
    'cmdk.typeStore': 'Produk',
    'cmdk.hintNavigate': 'navigasi',
    'cmdk.hintSelect': 'pilih',
    'cmdk.hintClose': 'tutup',
    'cmdk.kbd': '⌘K',

    // Comments (approximate; needs native review)
    'comments.countTitle': '{count} Komentar',
    'comments.composerPlaceholder': 'Bagikan pendapat Pian…',
    'comments.send': 'Kirim',
    'comments.reply': 'Balas',
    'comments.replyPlaceholder': 'Balas ke {name}…',
    'comments.upvote': 'Upvote',
    'comments.report': 'Laporkeun',
    'comments.share': 'Bagikan',
    'comments.hideReplies': 'Sambunyikan balasan',
    'comments.showReplies': 'Tampilkan balasan',
    'comments.showMore': 'Tampilkan labih banyak',
    'comments.maker': 'Maker',
    'comments.timeAgo.justNow': 'baru saia',
    'comments.timeAgo.minutes': '{n}m lalu',
    'comments.timeAgo.hours': '{n}j lalu',
    'comments.timeAgo.days': '{n}h lalu',
  },
  jv: {
    // Navigation — Javanese. Approximate; needs native review.
    'nav.overview': 'Ringkesan',
    'nav.websites': 'Situs Web',
    'nav.pricing': 'Rega',
    'nav.blog': 'Blog',
    'nav.store': 'Toko',
    'nav.submit': 'Kirim',
    'nav.sponsors': 'Sponsor',
    'nav.buyKukode': 'Tuku Kukode',
    'nav.leaderboard': 'Papan Peringkat',
    'nav.signin': 'Mlebu',
    'nav.signup': 'Ndhaptar',
    'nav.signout': 'Metu',
    'nav.dashboard': 'Dasbor',
    'nav.settings': 'Pangaturan',
    'nav.admin': 'Panel Admin',

    // Footer
    'footer.stayConnected': 'Tetep nyambung karo masa depan Kukode',
    'footer.subscribe': 'Langganan',
    'footer.emailPlaceholder': 'kowe@conto.com',

    // Auth Pages
    'auth.signinTitle': 'Mlebu menyang Kukode',
    'auth.signupTitle': 'Gawe akun anyar',
    'auth.emailLabel': 'Alamat email',
    'auth.passwordLabel': 'Tembung sandi',
    'auth.usernameLabel': 'Jeneng pangguna',
    'auth.fullNameLabel': 'Jeneng Lengkap',
    'auth.haveAccount': 'Wis duwe akun?',
    'auth.noAccount': 'Durung duwe akun?',
    'auth.signinButton': 'Mlebu',
    'auth.signupButton': 'Ndhaptar Akun',
    'auth.submitting': 'Monggo ditunggu...',

    // About Page — Javanese. Approximate; needs native review.
    'about.title': 'Apa iku Kukode?',
    'about.desc':
      'Kukode minangka direktori kurasi sing ngemot situs web, sistem desain, lan templat Astro/HTML tingkat produksi — ditinjau déning redaksi lan dikurasi kanggo desainer lan pangembang.',
    'about.p1':
      'Kukode minangka direktori kurasi sing ngemot situs web, sistem desain, lan templat Astro/HTML tingkat produksi kanggo desainer, pangembang, lan profesional kreatif sing pengin ngevaluasi karya nyata — dudu konsep abstrak. Saben entri ing Kukode nyambung menyang situs utawa produk sing bisa diakses publik lan wis ditinjau sacara éditorial sadurunge diterbitake. Platform iki nggabungake telung bab: direktori produk publik kanthi rotasi situs saben dina, sistem voting lan papan peringkat adhedhasar komunitas, lan toko kanggo templat premium lan produk digital. Pendaftaran kabuka liwat kaca /submit lan ditinjau déning tim redaksi Kukode sajrone pitung dina. Situs kasedhiya ing limang basa — Inggris, Indonesia, Banjar, Jawa, lan Melayu — lan mlaku ing Cloudflare Workers kanthi wektu tanggepan global ing ngisor 100ms. Kukode ora nyathet karya konsep, placeholder lorem-ipsum, situs tanpa URL publik, utawa produk sing gagal ing tinjauan aksesibilitas éditorial.',
    'about.p2':
      'Saliyané direktori, Kukode nerbitake artikel jero babagan tipografi, sistem desain, lan piranti front-end ing /blog/. Anggota bisa mènèhi swara kanggo produk, nututi maker tartamtu, lan langganan newsletter mingguan. Koleksi kurasi, tutorial terfokus, lan rincian tren dirancang kanggo nambah kaputusan — ora mung kanggo inspirasi.',
    'about.p3':
      'Kukode ora nampa sponsorship kanggo ndhisikaké listing, lan tinjauan redaksi bébas saka pamasangan mbayar. Platform iki open source lan nampa pull request kanggo terjemahan, peningkatan aksesibilitas, lan topik anyar.',
    'about.quote': '',
    'about.author': 'Tim redaksi Kukode',

    // Advertise Page
    'adv.title': 'Selehake peluncuran Panjenengan ing ngarepe audiens Kukode',
    'adv.subtitle':
      'Tekani desainer lan pangembang kang aktif goleki inspirasi tingkat produksi. Pilih paket utawa gawe kampanye khusus.',
    'adv.pkg1Name': 'Artikel Sponsor',
    'adv.pkg1Price': 'Rp899.000',
    'adv.pkg1Desc':
      'Tuladhane khusus babagan Kukode kang nuduhake produk Panjenengan ing konteks. Cocog banget kanggo peluncuran kang mbutuhake kredibilitas langsung.',
    'adv.pkg2Name': 'Iklan Newsletter',
    'adv.pkg2Price': 'Rp1.299.000',
    'adv.pkg2Desc':
      'Amanake papan iklan ing newsletter mingguan kita. Tekani audiens desainer lan pangembang kurasi kang goleki alat produksi.',
    'adv.features': 'Fitur kang dipunolehi:',

    // Pricing Page
    'pricing.title': 'Rega kang sederhana lan transparan',
    'pricing.subtitle':
      'Pilih paket sing cocog karo alur kerjamu. Kabeh paket kalebu nganyari selawase lan dhukungan premium.',
    'pricing.monthly': 'Tagihan saben wulan',
    'pricing.yearly': 'Tagihan saben taun (Nglaburake 20%)',
    'pricing.starterName': 'Starter',
    'pricing.starterPrice': 'Rp299.000',
    'pricing.starterDesc':
      'Fitur wigati kanggo desainer, pangembang piranti alus, lan pangripta konten pamula.',
    'pricing.proName': 'Pro',
    'pricing.proPrice': 'Rp799.000',
    'pricing.proDesc':
      'Cocog banget kanggo pangembang profesional, tim, lan pangripta produk kanthi tuwuh dhuwur.',
    'pricing.features': 'Kabeh paket kalebu:',
    'pricing.choosePlan': 'Pilih Paket',

    // Submit Page
    'submit.title': 'Kirimake kreasi Panjenengan',
    'submit.subtitle':
      'Dumukake proyek web modern, sumber daya CSS, utawa templat Astro Panjenengan karo komunitas pangembang global.',
    'submit.nameLabel': 'Jeneng Produk',
    'submit.taglineLabel': 'Tagline',
    'submit.descLabel': 'Deskripsi Cekak',
    'submit.urlLabel': 'URL Live',
    'submit.thumbLabel': 'URL Gambar Cilik',
    'submit.tagsLabel': 'Tag (dipisahake koma)',
    'submit.button': 'Kirim Produk',

    // Hero / Previews
    'hero.titleLine1': 'Ora konsep.',
    'hero.titleLine2': 'Mung situs web nyata.',
    'hero.cta': 'Mulai',
    'hero.desc':
      'Kumpulan situs web produksi pilihan kang pantes dipelajari — tata letak, hierarki, interaksi, lan eksekusi. Gunakake kanggo tolok ukur karyamu, ora niru.',
    'sites.allTags': 'Kabeh Tag',
    'sites.terbaru': 'Anyar',
    'sites.populer': 'Populer',
    'sites.showMore': 'Tuduhake luwih akeh',
    'blog.latestArticles': 'Artikel paling anyar',
    'blog.seeAllArticles': 'Deleng kabeh artikel',
    'blog.latestPosts': 'Postingan paling anyar',
    'blog.seeAllPosts': 'Deleng kabeh postingan',
    'store.latestTemplates': 'Templat paling anyar',
    'store.seeThemAll': 'Deleng kabeh!',
    'store.moreProducts': 'Produk liyane',
    'store.seeAllProducts': 'Deleng kabeh produk',

    // Store Pages
    'store.seoTitle': 'Templat & Produk',
    'store.seoDesc':
      'Tuku pilihan templat HTML/Astro lan produk developer digital premium kita.',
    'store.title': 'Produk kita',
    'store.desc':
      'Tuku pilihan produk digital kita kanggo nulungi tuwuh bisnis Panjenengan lan nggawe urip Panjenengan luwih gampang lan produktif',
    'store.paymentSuccess': 'Pambayaran Kasil!',
    'store.paymentSuccessDesc':
      'Matur nuwun wis tuku. Rincian produk bakal dikirimake ing email Panjenengan sakcepete.',
    'store.paymentFailed': 'Pambayaran Gagal utawa Dibatalake',
    'store.paymentFailedDesc':
      'Proses checkout ora rampung. Monggo dicoba maneh.',

    // Dashboard
    'dashboard.welcome': 'Sugeng rawuh malih,',
    'dashboard.submitted': 'Produk Dikirimake',
    'dashboard.approved': 'Disetujoni',
    'dashboard.totalVotes': 'Total Poling',
    'dashboard.totalViews': 'Total Dideleng',
    'dashboard.emptyTitle': 'Durung ana produk kang dikirim',
    'dashboard.emptyDesc':
      'Panjenengan durung ngirim produk apa wae. Kirimake produk kapisan Panjenengan saiki kanggo oleh eksposur!',
    'dashboard.emptyAction': 'Kirimake Produk Kapisan',
    'dashboard.myProducts': 'Produk Kula',
    'dashboard.manageSubmissions': 'Kelola kiriman produk Panjenengan lan pantau performane.',
    'dashboard.submitNewProduct': 'Kirimake Produk Anyar',
    'dashboard.viewPage': 'Deleng Kaca',
    'dashboard.analytics': 'Analitik',
    'dashboard.awaitingApproval': 'Nunggu Persetujuan',
    'dashboard.submissionRejected': 'Pengiriman Ditolak',
    'dashboard.pendingReview': 'Nunggu Tinjauan',
    'dashboard.rejected': 'Ditolak',
    'dashboard.submittedOn': 'Dikirimake ing ',
    'dashboard.rejectionReason': 'Alesan Ditolak:',

    // Leaderboard
    'leaderboard.title': 'Papan Peringkat',
    'leaderboard.description': 'Situs web paling populer kanthi upvote paling akeh ing Kukode.',
    'leaderboard.discover':
      'Temokake produk-produk paling populer kang dikurasi dening komunitas pangembang.',
    'leaderboard.weekly': 'Saben Minggu',
    'leaderboard.monthly': 'Saben Wulan',
    'leaderboard.allTime': 'Saklawase',
    'leaderboard.empty': 'Durung ana produk kang oleh upvote.',
    'leaderboard.votes': 'Swara',

    // Settings
    'settings.usernameUsed': 'Jeneng pangguna wis dijupuk. Pilih jeneng liyane.',
    'settings.successUpdate': 'Profil kasil dianyari!',
    'settings.failUpdate': 'Gagal nganyari profil.',
    'settings.bioPlaceholder': 'Critakake sethithik babagan Panjenengan...',
    'settings.saveChanges': 'Simpen Owah-owahan',
    'settings.fullName': 'Jeneng Lengkap',
    'settings.bio': 'Bio',
    'settings.website': 'Situs Web',
    'settings.avatarLabel': 'Foto Profil',
    'settings.avatarHelp': 'Format JPEG, PNG, utawa WebP. Ukuran maksimal 2MB.',
    'settings.passkeysTitle': 'Passkey & Keamanan Biometrik',
    'settings.passkeysDesc':
      'Passkey ngidini Panjenengan mlebu kanthi aman nganggo sidik jari, pindai pasuryan, utawa PIN piranti, tanpa ngetik tembung sandi.',
    'settings.noPasskeys': 'Durung ana passkey kang kadhaptar.',
    'settings.passkeyCreated': 'Digawe ing',
    'settings.passkeyRemove': 'Busak',
    'settings.passkeyRegister': 'Daftarake passkey anyar',
    'settings.passkeyGenerating': 'Nggawe opsi...',
    'settings.passkeyWaiting': 'Nunggu autentikator...',
    'settings.passkeyFailedCreate': 'Gagal nggawe kredensial',
    'settings.passkeyVerifying': 'M verifikasi...',
    'settings.passkeyRegistered': 'Passkey kasil kadhaptar! Nyegerake...',
    'settings.passkeyRegistrationFailed': 'Pendaftaran gagal',
    'settings.passkeyRemoved': 'Passkey kasil dibusak',
    'settings.passkeyRemoveTitle': 'Busak Passkey',
    'settings.passkeyRemoveMessage':
      'Apa Panjenengan yakin arep mbusak passkey iki? Panjenengan ora bakal bisa nggunakake maneh kanggo mlebu.',
    'settings.uploadingAvatar': 'Ngunggah Avatar...',
    'settings.usernameInvalid':
      'Jeneng pangguna mung ngemot huruf, angka, tanda hubung, lan garis ngisor.',
    'settings.websiteInvalid': 'URL situs web kudu diwiwiti nganggo http:// utawa https://',
    'settings.avatarTooLarge': 'Ukuran avatar kudu kurang saka 2MB.',
    'settings.avatarNotImage': 'Avatar kudu gambar.',

    // Common
    'common.areYouSure': 'Apa Panjenengan yakin?',
    'common.confirm': 'Konfirmasi',
    'common.cancel': 'Batal',

    // Rate limit
    'rateLimit.tooMany': 'Kakehan panyuwunan. Monggo dicoba maneh sawetara.',

    // Command palette (cmdk-style)
    'cmdk.open': 'Buka palet printah',
    'cmdk.search': 'Golek ing Kukode…',
    'cmdk.searchPlaceholder': 'Golek kaca, artikel, situs, produk…',
    'cmdk.noResults': 'Ora ana asil.',
    'cmdk.typePage': 'Kaca',
    'cmdk.typePost': 'Artikel',
    'cmdk.typeSite': 'Situs',
    'cmdk.typeStore': 'Produk',
    'cmdk.hintNavigate': 'navigasi',
    'cmdk.hintSelect': 'pilih',
    'cmdk.hintClose': 'tutup',
    'cmdk.kbd': '⌘K',

    // Comments (approximate; needs native review)
    'comments.countTitle': '{count} Komentar',
    'comments.composerPlaceholder': 'Dumukake pamikir Panjenengan…',
    'comments.send': 'Kirim',
    'comments.reply': 'Walesan',
    'comments.replyPlaceholder': 'Walesan kanggo {name}…',
    'comments.upvote': 'Upvote',
    'comments.report': 'Laporkeun',
    'comments.share': 'Dumukake',
    'comments.hideReplies': 'Sambunyikake walesan',
    'comments.showReplies': 'Tuduhake walesan',
    'comments.showMore': 'Tuduhake luwih akeh',
    'comments.maker': 'Maker',
    'comments.timeAgo.justNow': 'baru wae',
    'comments.timeAgo.minutes': '{n}m kepungkur',
    'comments.timeAgo.hours': '{n}j kepungkur',
    'comments.timeAgo.days': '{n}d kepungkur',
  },
  ms: {
    // Navigation — Malay (Bahasa Melayu). Approximate; needs native review.
    'nav.overview': 'Gambaran Keseluruhan',
    'nav.websites': 'Laman Web',
    'nav.pricing': 'Harga',
    'nav.blog': 'Blog',
    'nav.store': 'Kedai',
    'nav.submit': 'Hantar',
    'nav.sponsors': 'Penaja',
    'nav.buyKukode': 'Beli Kukode',
    'nav.leaderboard': 'Papan Kedudukan',
    'nav.signin': 'Log Masuk',
    'nav.signup': 'Daftar',
    'nav.signout': 'Log Keluar',
    'nav.dashboard': 'Papan Pemuka',
    'nav.settings': 'Tetapan',
    'nav.admin': 'Panel Pentadbir',

    // Footer
    'footer.stayConnected': 'Kekal terhubung dengan masa depan Kukode',
    'footer.subscribe': 'Langgan',
    'footer.emailPlaceholder': 'awak@contoh.com',

    // Rate limit
    'rateLimit.tooMany': 'Terlalu banyak permintaan. Sila cuba lagi sedikit masa.',

    // Command palette (cmdk-style) — approximate; needs native review
    'cmdk.open': 'Buka palet arahan',
    'cmdk.search': 'Cari di Kukode…',
    'cmdk.searchPlaceholder': 'Cari halaman, artikel, laman, produk…',
    'cmdk.noResults': 'Tiada hasil dijumpai.',
    'cmdk.typePage': 'Halaman',
    'cmdk.typePost': 'Artikel',
    'cmdk.typeSite': 'Laman',
    'cmdk.typeStore': 'Produk',
    'cmdk.hintNavigate': 'navigasi',
    'cmdk.hintSelect': 'pilih',
    'cmdk.hintClose': 'tutup',
    'cmdk.kbd': '⌘K',

    // Comments — approximate; needs native review
    'comments.countTitle': '{count} Komen',
    'comments.composerPlaceholder': 'Kongsi pendapat anda…',
    'comments.send': 'Hantar',
    'comments.reply': 'Balas',
    'comments.replyPlaceholder': 'Balas kepada {name}…',
    'comments.upvote': 'Upvote',
    'comments.report': 'Lapor',
    'comments.share': 'Kongsi',
    'comments.hideReplies': 'Sembunyikan balasan',
    'comments.showReplies': 'Tunjukkan balasan',
    'comments.showMore': 'Tunjukkan lagi',
    'comments.maker': 'Maker',
    'comments.timeAgo.justNow': 'baru sahaja',
    'comments.timeAgo.minutes': '{n}m lalu',
    'comments.timeAgo.hours': '{n}j lalu',
    'comments.timeAgo.days': '{n}h lalu',

    // Auth Pages
    'auth.signinTitle': 'Log masuk ke Kukode',
    'auth.signupTitle': 'Cipta akaun baharu',
    'auth.emailLabel': 'Alamat e-mel',
    'auth.passwordLabel': 'Kata laluan',
    'auth.usernameLabel': 'Nama pengguna',
    'auth.fullNameLabel': 'Nama Penuh',
    'auth.haveAccount': 'Sudah mempunyai akaun?',
    'auth.noAccount': 'Belum mempunyai akaun?',
    'auth.signinButton': 'Log Masuk',
    'auth.signupButton': 'Daftar Akaun',
    'auth.submitting': 'Sila tunggu...',

    // About Page — Malay. Approximate; needs native review.
    'about.title': 'Apakah Kukode?',
    'about.desc':
      'Kukode ialah direktori kurasi yang mengandungi laman web, sistem reka bentuk, dan templat Astro/HTML gred pengeluaran — disemak oleh redaksi dan dikurasi untuk pereka serta pembangun.',
    'about.p1':
      'Kukode ialah direktori kurasi yang mengandungi laman web, sistem reka bentuk, dan templat Astro/HTML gred pengeluaran untuk pereka, pembangun, dan profesional kreatif yang ingin menilai kerja sebenar — bukan konsep abstrak. Setiap entri di Kukode berpaut ke laman atau produk yang boleh diakses awam dan telah disemak secara editorial sebelum diterbitkan. Platform ini menggabungkan tiga perkara: direktori produk awam dengan putaran laman harian, sistem undian dan papan kedudukan berasaskan komuniti, dan kedai untuk templat premium dan produk digital. Penyerahan terbuka melalui halaman /submit dan disemak oleh pasukan redaksi Kukode dalam tempoh tujuh hari. Laman tersedia dalam lima bahasa — Inggeris, Indonesia, Banjar, Jawa, dan Melayu — dan berjalan di Cloudflare Workers dengan masa tindak balas global di bawah 100ms. Kukode tidak menyenaraikan kerja konsep, pemegang tempat lorem-ipsum, laman tanpa URL awam, atau produk yang gagal dalam semakan aksesibiliti editorial.',
    'about.p2':
      'Selain direktori, Kukode menerbitkan artikel mendalam tentang tipografi, sistem reka bentuk, dan alatan front-end di /blog/. Ahli boleh mengundi produk, mengikuti pembuat tertentu, dan melanggan surat berita mingguan. Koleksi kurasi, tutorial tertumpu, dan pecahan trend dibina untuk menambah baik keputusan — bukan sekadar memberi inspirasi.',
    'about.p3':
      'Kukode tidak menerima tajaan untuk menaikkan senarai, dan semakan redaksi adalah bebas daripada penempatan berbayar. Platform ini bersifat sumber terbuka dan menerima pull request untuk terjemahan, penambahbaikan aksesibiliti, dan topik baharu.',
    'about.quote': '',
    'about.author': 'Pasukan redaksi Kukode',

    // Advertise Page
    'adv.title': 'Letakkan pelancaran anda di hadapan audiens Kukode',
    'adv.subtitle':
      'Capai pereka dan pembangun yang aktif mencari inspirasi gred pengeluaran. Pilih pakej atau bina kempen khas.',
    'adv.pkg1Name': 'Artikel Ditaja',
    'adv.pkg1Price': 'Rp899.000',
    'adv.pkg1Desc':
      'Tulisan khas tentang Kukode yang menunjukkan produk anda dalam konteks. Sesuai untuk pelancaran yang memerlukan kredibiliti segera.',
    'adv.pkg2Name': 'Iklan Surat Berita',
    'adv.pkg2Price': 'Rp1.299.000',
    'adv.pkg2Desc':
      'Selamatkan ruang iklan dalam surat berita mingguan kami. Capai audiens pereka dan pembangun kurasi yang mencari alat pengeluaran.',
    'adv.features': 'Ciri yang diperoleh:',

    // Pricing Page
    'pricing.title': 'Harga yang mudah dan telus',
    'pricing.subtitle':
      'Pilih pakej yang sesuai dengan aliran kerja anda. Semua pakej termasuk kemas kini seumur hidup dan sokongan premium.',
    'pricing.monthly': 'Pencaj bulanan',
    'pricing.yearly': 'Pencaj tahunan (Jimat 20%)',
    'pricing.starterName': 'Starter',
    'pricing.starterPrice': 'Rp299.000',
    'pricing.starterDesc':
      'Ciri penting untuk pereka, pembangun perisian, dan pencipta kandungan permulaan.',
    'pricing.proName': 'Pro',
    'pricing.proPrice': 'Rp799.000',
    'pricing.proDesc':
      'Sangat sesuai untuk pembangun profesional, pasukan, dan pencipta produk dengan pertumbuhan tinggi.',
    'pricing.features': 'Semua pakej termasuk:',
    'pricing.choosePlan': 'Pilih Pakej',

    // Submit Page
    'submit.title': 'Hantar ciptaan anda',
    'submit.subtitle':
      'Kongsi projek web moden, sumber CSS, atau templat Astro anda dengan komuniti pembangun global.',
    'submit.nameLabel': 'Nama Produk',
    'submit.taglineLabel': 'Tagline',
    'submit.descLabel': 'Penerangan Ringkas',
    'submit.urlLabel': 'URL Live',
    'submit.thumbLabel': 'URL Imej Kecil',
    'submit.tagsLabel': 'Tag (asingkan dengan koma)',
    'submit.button': 'Hantar Produk',

    // Hero / Previews
    'hero.titleLine1': 'Tiada konsep.',
    'hero.titleLine2': 'Hanya laman web sebenar.',
    'hero.cta': 'Mula',
    'hero.desc':
      'Koleksi laman web pengeluaran pilihan yang wajar dikaji — tata letak, hierarki, interaksi, dan pelaksanaan. Gunakannya untuk menanda aras kerja anda sendiri, bukan meniru.',
    'sites.allTags': 'Semua Tag',
    'sites.terbaru': 'Terbaru',
    'sites.populer': 'Popular',
    'sites.showMore': 'Tunjukkan lebih banyak',
    'blog.latestArticles': 'Artikel terkini',
    'blog.seeAllArticles': 'Lihat semua artikel',
    'blog.latestPosts': 'Siaran terkini',
    'blog.seeAllPosts': 'Lihat semua siaran',
    'store.latestTemplates': 'Templat terkini kami',
    'store.seeThemAll': 'Lihat semua!',
    'store.moreProducts': 'Produk lain',
    'store.seeAllProducts': 'Lihat semua produk',

    // Store Pages
    'store.seoTitle': 'Templat & Produk',
    'store.seoDesc':
      'Beli pilihan templat HTML/Astro dan produk pembangun digital premium kami.',
    'store.title': 'Produk kami',
    'store.desc':
      'Beli pilihan produk digital kami untuk membantu mengembangkan perniagaan anda dan menjadikan hidup anda lebih mudah dan produktif',
    'store.paymentSuccess': 'Pembayaran Berjaya!',
    'store.paymentSuccessDesc':
      'Terima kasih atas pembelian anda. Butiran produk akan dihantar ke e-mel anda tidak lama lagi.',
    'store.paymentFailed': 'Pembayaran Gagal atau Dibatalkan',
    'store.paymentFailedDesc':
      'Proses checkout tidak selesai. Sila cuba lagi.',

    // Dashboard
    'dashboard.welcome': 'Selamat kembali,',
    'dashboard.submitted': 'Produk Dihantar',
    'dashboard.approved': 'Diluluskan',
    'dashboard.totalVotes': 'Jumlah Undi',
    'dashboard.totalViews': 'Jumlah Dilihat',
    'dashboard.emptyTitle': 'Belum ada produk dihantar',
    'dashboard.emptyDesc':
      'Anda belum menghantar sebarang produk. Hantar produk pertama anda sekarang untuk mendapat pendedahan!',
    'dashboard.emptyAction': 'Hantar Produk Pertama',
    'dashboard.myProducts': 'Produk Saya',
    'dashboard.manageSubmissions':
      'Urus penghantaran produk anda dan pantau prestasinya.',
    'dashboard.submitNewProduct': 'Hantar Produk Baharu',
    'dashboard.viewPage': 'Lihat Halaman',
    'dashboard.analytics': 'Analitik',
    'dashboard.awaitingApproval': 'Menunggu Kelulusan',
    'dashboard.submissionRejected': 'Penghantaran Ditolak',
    'dashboard.pendingReview': 'Menunggu Semakan',
    'dashboard.rejected': 'Ditolak',
    'dashboard.submittedOn': 'Dihantar pada ',
    'dashboard.rejectionReason': 'Sebab Penolakan:',

    // Leaderboard
    'leaderboard.title': 'Papan Kedudukan',
    'leaderboard.description': 'Laman web paling popular dengan undian terbanyak di Kukode.',
    'leaderboard.discover':
      'Temui produk-produk paling popular yang dikurasi oleh komuniti pembangun.',
    'leaderboard.weekly': 'Mingguan',
    'leaderboard.monthly': 'Bulanan',
    'leaderboard.allTime': 'Sepanjang Masa',
    'leaderboard.empty': 'Belum ada produk mendapat undian.',
    'leaderboard.votes': 'Undi',

    // Settings
    'settings.usernameUsed': 'Nama pengguna sudah diambil. Pilih nama lain.',
    'settings.successUpdate': 'Profil berjaya dikemas kini!',
    'settings.failUpdate': 'Gagal mengemas kini profil.',
    'settings.bioPlaceholder': 'Ceritakan sedikit tentang anda...',
    'settings.saveChanges': 'Simpan Perubahan',
    'settings.fullName': 'Nama Penuh',
    'settings.bio': 'Bio',
    'settings.website': 'Laman Web',
    'settings.avatarLabel': 'Gambar Profil',
    'settings.avatarHelp': 'Format JPEG, PNG, atau WebP. Saiz maksimum 2MB.',
    'settings.passkeysTitle': 'Passkey & Keselamatan Biometrik',
    'settings.passkeysDesc':
      'Passkey membolehkan anda log masuk dengan selamat menggunakan cap jari, imbasan muka, atau PIN peranti, tanpa menaip kata laluan.',
    'settings.noPasskeys': 'Belum ada passkey didaftarkan.',
    'settings.passkeyCreated': 'Dicipta pada',
    'settings.passkeyRemove': 'Buang',
    'settings.passkeyRegister': 'Daftarkan passkey baharu',
    'settings.passkeyGenerating': 'Menjana pilihan...',
    'settings.passkeyWaiting': 'Menunggu pengesah...',
    'settings.passkeyFailedCreate': 'Gagal mencipta kelayakan',
    'settings.passkeyVerifying': 'Mengesahkan...',
    'settings.passkeyRegistered': 'Passkey berjaya didaftarkan! Menyegarkan...',
    'settings.passkeyRegistrationFailed': 'Pendaftaran gagal',
    'settings.passkeyRemoved': 'Passkey berjaya dibuang',
    'settings.passkeyRemoveTitle': 'Buang Passkey',
    'settings.passkeyRemoveMessage':
      'Adakah anda pasti ingin membuang passkey ini? Anda tidak akan dapat menggunakannya lagi untuk log masuk.',
    'settings.uploadingAvatar': 'Memuat naik Avatar...',
    'settings.usernameInvalid':
      'Nama pengguna hanya boleh mengandungi huruf, nombor, tanda hubung, dan garis bawah.',
    'settings.websiteInvalid': 'URL laman web mesti bermula dengan http:// atau https://',
    'settings.avatarTooLarge': 'Saiz avatar mesti kurang daripada 2MB.',
    'settings.avatarNotImage': 'Avatar mestilah fail gambar.',

    // Common
    'common.areYouSure': 'Adakah anda pasti?',
    'common.confirm': 'Sahkan',
    'common.cancel': 'Batal',
  },
} as const;