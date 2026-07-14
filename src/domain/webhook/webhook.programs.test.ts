import { describe, it, expect } from 'vitest';
import { Layer, ManagedRuntime } from 'effect';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { IWebhookRepository } from './webhook.repository';
import { processXenditCallbackProgram } from './webhook.programs';
import { IMailerService } from '@/infra/mail/mailer.service';

const DummyMail = Layer.succeed(IMailerService, {
  sendEmail: () => Effect.void,
});

function runWebhook(
  repo: typeof IWebhookRepository.Service,
  payload: any,
) {
  const RepoLayer = Layer.succeed(IWebhookRepository, repo);
  const rt = ManagedRuntime.make(Layer.mergeAll(RepoLayer, DummyMail));
  return rt.runPromise(processXenditCallbackProgram(payload, 'test-token', 'test-token'));
}

describe('Xendit webhook – idempotency', () => {
  it('processes first PAID callback normally', async () => {
    let called = false;
    const mock: typeof IWebhookRepository.Service = createWhMock({
      findPurchase: () => Effect.succeed(undefined),
      completePurchase: () => Effect.sync(() => { called = true; }),
    });
    await runWebhook(mock, {
      id: 'inv-1',
      external_id: 'adv_article_user-1_site-1_123',
      status: 'PAID',
    });
    expect(called).toBe(true);
  });

  it('skips processing if already completed (duplicate callback)', async () => {
    let called = false;
    const mock: typeof IWebhookRepository.Service = createWhMock({
      findPurchase: () => Effect.succeed({ status: 'completed' }),
      completePurchase: () => Effect.sync(() => { called = true; }),
    });
    await runWebhook(mock, {
      id: 'inv-1',
      external_id: 'adv_article_user-1_site-1_123',
      status: 'PAID',
    });
    expect(called).toBe(false);
  });

  it('rejects missing required fields', async () => {
    const mock = createWhMock();
    await expect(runWebhook(mock, { status: 'PAID' })).rejects.toThrow('Missing required');
  });

  it('rejects unauthorized callback', async () => {
    // null request token vs expected 'test-token' → UnauthorizedError
    const RepoLayer = Layer.succeed(IWebhookRepository, createWhMock());
    const rt = ManagedRuntime.make(Layer.mergeAll(RepoLayer, DummyMail));
    await expect(
      rt.runPromise(processXenditCallbackProgram(
        { id: 'x', external_id: 'y', status: 'PAID' },
        null,        // requestToken = null
        'test-token' // callbackToken = 'test-token'
      ))
    ).rejects.toThrow('Unauthorized');
  });
});

function createWhMock(overrides: Partial<typeof IWebhookRepository.Service> = {}): typeof IWebhookRepository.Service {
  const defaults: typeof IWebhookRepository.Service = {
    updatePurchaseStatus: () => Effect.void,
    markSiteAsSponsored: () => Effect.void,
    completePurchase: () => Effect.void,
    findPurchase: () => Effect.succeed(undefined),
    getUserProfile: () => Effect.succeed(null),
    getSiteTitle: () => Effect.succeed('Test Site'),
  };
  return { ...defaults, ...overrides };
}
