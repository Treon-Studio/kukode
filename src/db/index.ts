import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

let dbUrl = import.meta.env.TURSO_DATABASE_URL || 'libsql://dummy.turso.io';
const authToken = import.meta.env.TURSO_AUTH_TOKEN || 'dummy';

// Cloudflare Workers web driver does not support "file:" URLs.
// During the Astro build step (PROD), if the env still has file:, we swap it out.
if (import.meta.env.PROD && dbUrl.startsWith('file:')) {
  dbUrl = 'libsql://dummy.turso.io';
}

let client;
try {
  client = createClient({ url: dbUrl, authToken });
} catch (e) {
  // Fallback to prevent module crash
  client = createClient({ url: 'libsql://dummy.turso.io', authToken: 'dummy' });
}

export const db = drizzle(client, { schema });
