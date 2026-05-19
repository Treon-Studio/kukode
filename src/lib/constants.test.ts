import { describe, expect, it } from 'vitest';
import { APP_CONFIG, AUTH_CONFIG, NOTIFICATION_CONFIG, SITE_VALIDATION } from './constants';

describe('Constants Config Validation', () => {
  it('should verify APP_CONFIG boundaries', () => {
    expect(APP_CONFIG.BASE_URL).toContain('https://');
    expect(APP_CONFIG.DEFAULT_REDIRECT).toBe('/dashboard');
  });

  it('should verify AUTH_CONFIG boundaries', () => {
    expect(AUTH_CONFIG.COOKIE_SESSION_NAME).toBe('session_id');
    expect(AUTH_CONFIG.SESSION_DURATION_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(AUTH_CONFIG.HASH_ITERATIONS).toBeGreaterThanOrEqual(10000);
    expect(AUTH_CONFIG.MIN_PASSWORD_LENGTH).toBe(6);
  });

  it('should verify SITE_VALIDATION boundaries', () => {
    expect(SITE_VALIDATION.MAX_TAGLINE_LENGTH).toBe(60);
    expect(SITE_VALIDATION.MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    expect(SITE_VALIDATION.ACCEPTED_IMAGE_TYPES).toContain('image/png');
  });

  it('should verify NOTIFICATION_CONFIG boundaries', () => {
    expect(NOTIFICATION_CONFIG.ADMIN_EMAIL).toContain('@');
    expect(NOTIFICATION_CONFIG.COLORS.INFO).toBeDefined();
    expect(NOTIFICATION_CONFIG.COLORS.SUCCESS).toBeDefined();
  });
});
