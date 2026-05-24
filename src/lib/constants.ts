/**
 * Kukode System Constants & Configurations
 */

export const APP_CONFIG = {
  /** The base URL of the application */
  BASE_URL: 'https://kukode.treonstudio.com',

  /** Default fallback URL for signin redirections */
  DEFAULT_REDIRECT: '/dashboard',
};

export const AUTH_CONFIG = {
  /** Cookie name used to store the user's active session ID */
  COOKIE_SESSION_NAME: 'session_id',

  /** Duration of a session in seconds (30 days) */
  SESSION_DURATION_SECONDS: 30 * 24 * 60 * 60,

  /** Web Crypto PBKDF2 Iterations for password hashing */
  HASH_ITERATIONS: 10000,

  /** Minimum required password length */
  MIN_PASSWORD_LENGTH: 6,
};

export const SITE_VALIDATION = {
  /** Maximum length for product tagline */
  MAX_TAGLINE_LENGTH: 60,

  /** Maximum size for image file uploads (if ever used) - 5MB */
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,

  /** Acceptable mime types for image uploads */
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

export const NOTIFICATION_CONFIG = {
  /** Default administrator email for site notifications */
  ADMIN_EMAIL: 'admin@kukode.treonstudio.com',

  /** Fallback avatar URL for the Discord webhook notification bot */
  DISCORD_BOT_AVATAR: 'https://kukode.treonstudio.com/favicon.png',

  /** Discord notification color schemes */
  COLORS: {
    INFO: 0x3b82f6, // Blue
    SUCCESS: 0x10b981, // Emerald Green
    WARNING: 0xf59e0b, // Amber
    DANGER: 0xef4444, // Red
  },
};

export const NAVIGATION_LINKS = [
  { href: '/', translationKey: 'nav.websites' },
  { href: '/leaderboard/', translationKey: 'nav.leaderboard' },
  { href: '/pricing/', translationKey: 'nav.pricing' },
  { href: '/blog/', translationKey: 'nav.blog' },
  { href: '/store/', translationKey: 'nav.store' },
  { href: '/submit/', translationKey: 'nav.submit' },
  { href: '/advertise/', translationKey: 'nav.sponsors' },
] as const;
