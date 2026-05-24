import { Layer, ManagedRuntime } from 'effect';
import { DrizzleClientLive } from '../db/drizzle.client';
import { createCacheAdapterLive } from '../cache/cache.adapter';
import { MailerServiceLive } from '../mail/mailer.service';
import { DiscordServiceLive } from '../discord/discord.service';
import { PaymentServiceLive } from '../payment/payment.service.live';
import { getStorageLayer } from '@/lib/storage';

// Analytics, Sites, Store, Newsletter, Admin, Comments, Cron, Webhook layers
import { AnalyticsRepositoryLive } from '@/domain/analytics';
import { SiteRepositoryLive } from '@/domain/site';
import { StoreRepositoryLive } from '@/domain/store';
import { NewsletterRepositoryLive } from '@/domain/newsletter';
import { AdminRepositoryLive } from '@/domain/admin';
import { CommentsRepositoryLive } from '@/domain/comments';
import { CronRepositoryLive } from '@/domain/cron';
import { WebhookRepositoryLive } from '@/domain/webhook';

// Auth layers
import { AuthCryptoLive, AuthRepositoryLive } from '@/domain/auth';

export const createAppRuntime = (locals: any) => {
  const env = locals?.runtime?.env || (typeof import.meta !== 'undefined' ? import.meta.env : {});
  // Inject Drizzle instance from Cloudflare's D1 via locals or dev DB
  const drizzleLayer = DrizzleClientLive;
  
  // Storage layer resolved dynamically based on R2 binding
  const storageLayer = getStorageLayer(locals);
  
  const CacheAdapterLive = createCacheAdapterLive(env);

  const infrastructureLayer = Layer.mergeAll(
    drizzleLayer,
    CacheAdapterLive,
    MailerServiceLive,
    DiscordServiceLive,
    PaymentServiceLive,
    storageLayer,
    AuthCryptoLive
  );

  const domainLayer = Layer.mergeAll(
    AnalyticsRepositoryLive,
    SiteRepositoryLive,
    StoreRepositoryLive,
    NewsletterRepositoryLive,
    AdminRepositoryLive,
    CommentsRepositoryLive,
    CronRepositoryLive,
    WebhookRepositoryLive,
    AuthRepositoryLive
  );

  // Compose all infrastructure layers, providing infra to domain
  const MainLayer = Layer.merge(
    infrastructureLayer,
    Layer.provide(domainLayer, infrastructureLayer)
  );

  return ManagedRuntime.make(MainLayer);
};
