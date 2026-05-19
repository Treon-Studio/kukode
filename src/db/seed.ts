import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import * as dotenv from 'dotenv';
import { hashPassword } from '@/lib/auth-crypto';
import * as schema from './schema';

// Load environment variables from .env
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
const db = drizzle(client, { schema });

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Clean existing data
    console.log('🧹 Cleaning old tables...');
    await db.delete(schema.comments);
    await db.delete(schema.votes);
    await db.delete(schema.submittedSites);
    await db.delete(schema.profiles);
    await db.delete(schema.featureFlags);
    console.log('✅ Tables cleaned.');

    // 2. Hash passwords
    console.log('🔑 Hashing passwords...');
    const adminPasswordHash = await hashPassword('admin123');
    const makerPasswordHash = await hashPassword('maker123');
    const userPasswordHash = await hashPassword('user123');

    // 3. Seed Profiles
    console.log('👤 Seeding user profiles...');
    const profiles = await db
      .insert(schema.profiles)
      .values([
        {
          email: 'admin@kukode.com',
          password_hash: adminPasswordHash,
          username: 'admin',
          full_name: 'Kukode Admin',
          role: 'admin',
          bio: 'Lead curator and administrator of Kukode.',
          website: 'https://kukode.treonstudio.com',
        },
        {
          email: 'maker@treonstudio.com',
          password_hash: makerPasswordHash,
          username: 'treonstudio',
          full_name: 'Treon Studio',
          role: 'maker',
          bio: 'Premium web templates and software builder.',
          website: 'https://treonstudio.com',
          twitter: 'treonstudio',
          github: 'treonstudio',
        },
        {
          email: 'john@example.com',
          password_hash: userPasswordHash,
          username: 'johndoe',
          full_name: 'John Doe',
          role: 'user',
          bio: 'Front-end enthusiast and UI lover.',
        },
        {
          email: 'jane@example.com',
          password_hash: userPasswordHash,
          username: 'janedoe',
          full_name: 'Jane Doe',
          role: 'user',
          bio: 'Astro developer and back-end designer.',
        },
      ])
      .returning();

    const adminUser = profiles.find((p) => p.username === 'admin')!;
    const makerUser = profiles.find((p) => p.username === 'treonstudio')!;
    const johnUser = profiles.find((p) => p.username === 'johndoe')!;
    const janeUser = profiles.find((p) => p.username === 'janedoe')!;

    console.log('✅ Seeded profiles successfully.');

    // 4. Seed Submitted Sites
    console.log('🌐 Seeding showcase websites...');
    const sites = await db
      .insert(schema.submittedSites)
      .values([
        {
          maker_id: makerUser.id,
          title: 'Kukode Theme',
          tagline: 'Premium Astro template for modern design portfolios',
          description:
            'Kukode is a clean, hyper-minimalist Astro template optimized for designers, software developers, and creators. Featuring rich typography, deep styling control, and seamless dynamic animations.',
          live_url: 'https://treonstudio.com/templates/kukode',
          thumbnail_url: 'https://treonstudio.com/templates/kukode/og-image.jpg',
          tags: ['astro', 'tailwind', 'design'],
          status: 'approved',
          views_count: 142,
          approved_at: new Date().toISOString(),
        },
        {
          maker_id: makerUser.id,
          title: 'Kukode Directory',
          tagline: 'Curated directory of modern developer platforms',
          description:
            'Kukode is a premium directory platform for web developers. Register accounts, submit your modern web products, upvote creations, write reviews, and build curated collections.',
          live_url: 'https://kukode.treonstudio.com',
          thumbnail_url: 'https://kukode.treonstudio.com/og-image.jpg',
          tags: ['astro', 'tailwind', 'productivity'],
          status: 'approved',
          views_count: 89,
          approved_at: new Date().toISOString(),
        },
        {
          maker_id: johnUser.id,
          title: 'Kukode UI Hub',
          tagline: 'Discover trending developer tools and CSS templates',
          description:
            'Kukode UI Hub collects the latest premium CSS stylesheets, HSL palettes, and typography presets. Easily export code snippets directly into your projects.',
          live_url: 'https://ui.kukode.com',
          thumbnail_url: 'https://ui.kukode.com/og-image.jpg',
          tags: ['development', 'colors', 'css'],
          status: 'approved',
          views_count: 53,
          approved_at: new Date().toISOString(),
        },
        {
          maker_id: janeUser.id,
          title: 'GeekFolio Builder',
          tagline: 'Custom portfolio creator for software engineers',
          description:
            'GeekFolio is a drag-and-drop builder for developer portfolios. Integrates directly with GitHub, dev.to, and Medium to showcase your work automatically.',
          live_url: 'https://geekfolio.io',
          thumbnail_url: 'https://geekfolio.io/og-image.jpg',
          tags: ['uiux', 'graphics'],
          status: 'pending_review',
          views_count: 0,
        },
      ])
      .returning();

    const carbonSite = sites.find((s) => s.title === 'Kukode Theme')!;
    const kukodeSite = sites.find((s) => s.title === 'Kukode Directory')!;
    const kukodeUiSite = sites.find((s) => s.title === 'Kukode UI Hub')!;
    console.log('✅ Seeded sites successfully.');

    // 5. Seed Votes
    console.log('👍 Seeding site upvotes...');
    await db.insert(schema.votes).values([
      // Kukode Theme votes
      { site_id: carbonSite.id, user_id: johnUser.id },
      { site_id: carbonSite.id, user_id: janeUser.id },
      { site_id: carbonSite.id, user_id: makerUser.id },

      // Kukode Directory votes
      { site_id: kukodeSite.id, user_id: johnUser.id },
      { site_id: kukodeSite.id, user_id: janeUser.id },

      // Kukode UI Hub votes
      { site_id: kukodeUiSite.id, user_id: janeUser.id },
    ]);
    console.log('✅ Seeded votes successfully.');

    // 6. Seed Comments
    console.log('💬 Seeding site comments...');
    await db.insert(schema.comments).values([
      {
        site_id: carbonSite.id,
        user_id: johnUser.id,
        content:
          'This Astro template looks incredibly slick! The typography hierarchy is absolutely top-notch.',
      },
      {
        site_id: carbonSite.id,
        user_id: janeUser.id,
        content:
          'Love the minimalist vibe and performance. Astro and Tailwind v4 are a great combination.',
      },
      {
        site_id: kukodeSite.id,
        user_id: johnUser.id,
        content:
          "Exactly the directory modern developers need. Love that it's connected with Turso DB!",
      },
    ]);
    console.log('✅ Seeded comments successfully.');

    // 7. Seed Feature Flags
    console.log('🚩 Seeding feature flags...');
    await db.insert(schema.featureFlags).values([
      {
        name: 'new-homepage-layout',
        description: 'Enables the redesigned modern hero sections on the main page.',
        is_enabled: false,
        env_override: true,
      },
      {
        name: 'allow-anonymous-votes',
        description: 'Allows visitors without an active session to upvote creations.',
        is_enabled: false,
        env_override: false,
      },
      {
        name: 'enable-comments-section',
        description: 'Toggles the entire comment review form on product detail pages.',
        is_enabled: true,
        env_override: false,
      },
    ]);
    console.log('✅ Seeded feature flags successfully.');

    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
