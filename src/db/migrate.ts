import { migrate } from 'drizzle-orm/libsql/migrator';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as dotenv from 'dotenv';
import { sendDiscordNotification } from '../lib/discord';
import { NOTIFICATION_CONFIG } from '../lib/constants';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error(
    '❌ Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be defined in your .env file.'
  );
  process.exit(1);
}

const client = createClient({ url, authToken });
const db = drizzle(client);

async function run() {
  console.log('🚀 Starting database migration...');

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Database migration completed successfully!');

    // Send Discord Success Notification
    await sendDiscordNotification({
      embeds: [
        {
          title: '✅ Database Migration Sukses!',
          description:
            'Perubahan skema database (migration) telah berhasil diterapkan pada database Turso.',
          color: NOTIFICATION_CONFIG.COLORS.SUCCESS,
          fields: [
            { name: 'Database URL', value: `\`${url}\``, inline: false },
            { name: 'Status', value: 'SUCCESS', inline: true },
            { name: 'Timestamp', value: new Date().toISOString(), inline: true },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Kukode Migrator System',
          },
        },
      ],
    });
  } catch (error: any) {
    console.error('❌ Database migration failed:', error);

    // Send Discord Failure Notification
    await sendDiscordNotification({
      embeds: [
        {
          title: '❌ Database Migration Gagal!',
          description:
            'Terjadi kesalahan saat menerapkan perubahan skema (migration) pada database Turso.',
          color: NOTIFICATION_CONFIG.COLORS.DANGER,
          fields: [
            { name: 'Database URL', value: `\`${url}\``, inline: false },
            {
              name: 'Error Message',
              value: `\`\`\`${error.message || error}\`\`\``,
              inline: false,
            },
            { name: 'Status', value: 'FAILED', inline: true },
            { name: 'Timestamp', value: new Date().toISOString(), inline: true },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Kukode Migrator System',
          },
        },
      ],
    });
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
