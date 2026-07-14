import { describe, it, expect, vi } from 'vitest';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { ISiteRepository } from './site.repository';
import { submitSiteProgram } from './site.programs';
import { IMailerService } from '@/infra/mail/mailer.service';
import { IDiscordService } from '@/infra/discord/discord.service';
import { StorageAdapter } from '@/lib/storage';

const DummyLayer = Layer.succeed(IMailerService, {
  sendEmail: () => Effect.void,
});
const DummyDiscord = Layer.succeed(IDiscordService, {
  notifyProjectSubmission: () => Effect.void,
  notifyUserRegistration: () => Effect.void,
});
const DummyStorage = Layer.succeed(StorageAdapter, {
  uploadFile: () => Effect.succeed({ url: 'https://example.com/img.jpg' }),
  deleteFile: () => Effect.void,
});

function buildRuntime(repo: typeof ISiteRepository.Service) {
  const SiteLayer = Layer.succeed(ISiteRepository, repo);
  const MainLayer = Layer.mergeAll(SiteLayer, DummyLayer, DummyDiscord, DummyStorage);
  return ManagedRuntime.make(MainLayer);
}

const baseProps = {
  title: 'Test Product',
  tagline: 'A short tagline',
  description: 'Full description here for testing',
  liveUrl: 'https://example.com',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  thumbnailFile: null as any,
  tagsRaw: 'test, demo',
};

describe('Submit stress – pipeline', () => {
  it('submits with valid data and upgrades user to maker', async () => {
    let saved = false;
    let upgraded = false;
    const mock: typeof ISiteRepository.Service = createBaseMock({
      saveSiteWithUpgrade: () =>
        Effect.sync(() => { saved = true; upgraded = true; return { id: 's-1' }; }),
    });
    const rt = buildRuntime(mock);
    await rt.runPromise(submitSiteProgram(baseProps, { id: 'u-1' }, { role: 'user' }, {}));
    expect(saved).toBe(true);
    expect(upgraded).toBe(true);
  });

  it('does not upgrade existing maker', async () => {
    let upgraded = false;
    const mock = createBaseMock({
      saveSite: () => Effect.succeed({ id: 's-1' }),
      upgradeUserRoleToMaker: () => Effect.sync(() => { upgraded = true; }),
    });
    const rt = buildRuntime(mock);
    await rt.runPromise(submitSiteProgram(baseProps, { id: 'u-1' }, { role: 'maker' }, {}));
    expect(upgraded).toBe(false);
  });

  it('rejects missing required fields', async () => {
    const mock = createBaseMock();
    const rt = buildRuntime(mock);
    await expect(
      rt.runPromise(submitSiteProgram(
        { ...baseProps, title: '' },
        { id: 'u-1' }, { role: 'user' }, {}
      ))
    ).rejects.toThrow('wajib diisi');
  });

  it('rejects duplicate URL', async () => {
    const mock = createBaseMock({
      existsByUrl: () => Effect.succeed(true),
    });
    const rt = buildRuntime(mock);
    await expect(
      rt.runPromise(submitSiteProgram(baseProps, { id: 'u-1' }, { role: 'user' }, {}))
    ).rejects.toThrow('sudah pernah disubmit');
  });
});

function createBaseMock(overrides: Partial<typeof ISiteRepository.Service> = {}): typeof ISiteRepository.Service {
  const defaults: typeof ISiteRepository.Service = {
    existsByUrl: () => Effect.succeed(false),
    saveSite: () => Effect.succeed({ id: 's-1' }),
    saveSiteWithUpgrade: () => Effect.succeed({ id: 's-1' }),
    upgradeUserRoleToMaker: () => Effect.void,
    findSiteForVote: () => Effect.succeed({ maker_id: 'maker-x' }),
    findVote: () => Effect.succeed(undefined),
    saveVote: () => Effect.void,
    deleteVote: () => Effect.void,
    countVotes: () => Effect.succeed(0),
    toggleVote: () => Effect.succeed({ voted: true, voteCount: 1 }),
    saveComment: () => Effect.void,
    getMakerInfoBySiteId: () => Effect.succeed(undefined),
    getApprovedSitesWithVotes: () => Effect.succeed([]),
    getApprovedSitesForSearch: () => Effect.succeed([]),
    getSiteDetailsWithVotes: () => Effect.succeed(null),
    incrementSiteViews: () => Effect.void,
    getCreatorDashboardStats: () => Effect.succeed({ submittedCount: 0, approvedCount: 0, totalViews: 0, totalVotes: 0 }),
    getCreatorSites: () => Effect.succeed([]),
    getLeaderboard: () => Effect.succeed([]),
    getPortfolioSites: () => Effect.succeed([]),
  };
  return { ...defaults, ...overrides };
}
