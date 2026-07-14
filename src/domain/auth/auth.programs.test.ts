import { describe, it, expect } from 'vitest';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { IAuthRepository } from './auth.repository';
import { signupProgram, signinProgram } from './auth.programs';
import { IAuthCrypto } from './auth.crypto';
import { IMailerService } from '@/infra/mail/mailer.service';
import { IDiscordService } from '@/infra/discord/discord.service';

const DummyMail = Layer.succeed(IMailerService, { sendEmail: () => Effect.void });
const DummyDiscord = Layer.succeed(IDiscordService, {
  notifyProjectSubmission: () => Effect.void,
  notifyUserRegistration: () => Effect.void,
});
const CryptoLayer = Layer.succeed(IAuthCrypto, {
  hashPassword: (pw: string) => Effect.succeed(`hashed:${pw}`),
  verifyPassword: (pw: string, hash: string) => Effect.succeed(hash === `hashed:${pw}`),
});

function buildRuntime(repo: typeof IAuthRepository.Service) {
  const RepoLayer = Layer.succeed(IAuthRepository, repo);
  return ManagedRuntime.make(Layer.mergeAll(RepoLayer, DummyMail, DummyDiscord, CryptoLayer));
}

describe('Auth stress', () => {
  it('signup creates user and session', async () => {
    let created = false;
    let sessionCreated = false;
    const mock: typeof IAuthRepository.Service = createAuthMock({
      createUser: () => Effect.sync(() => { created = true; return { id: 'u-1' }; }),
      createSession: () => Effect.sync(() => { sessionCreated = true; return { id: 'sess-1' }; }),
    });
    const rt = buildRuntime(mock);
    await rt.runPromise(signupProgram({
      email: 'test@test.com', password: 'password123',
      username: 'testuser', fullName: 'Test User',
    }));
    expect(created).toBe(true);
    expect(sessionCreated).toBe(true);
  });

  it('rejects duplicate email', async () => {
    const mock = createAuthMock({
      findUserByEmailOrUsername: () => Effect.succeed({ id: 'existing', email: 'dup@test.com' } as any),
    });
    const rt = buildRuntime(mock);
    await expect(
      rt.runPromise(signupProgram({
        email: 'dup@test.com', password: 'password123',
        username: 'newuser', fullName: 'New User',
      }))
    ).rejects.toThrow('Email sudah terdaftar');
  });

  it('signin verifies password and creates session', async () => {
    let verified = false;
    const mock = createAuthMock({
      findUserByEmail: () => Effect.succeed({
        id: 'u-1', email: 'a@b.com', password_hash: 'hashed:pass123',
      } as any),
      createSession: () => Effect.sync(() => { verified = true; return { id: 'sess-2' }; }),
    });
    const rt = buildRuntime(mock);
    const result = await rt.runPromise(signinProgram({
      email: 'a@b.com', password: 'pass123',
    }));
    expect(result.sessionId).toBe('sess-2');
  });

  it('rejects wrong password', async () => {
    const mock = createAuthMock({
      findUserByEmail: () => Effect.succeed({
        id: 'u-1', email: 'a@b.com', password_hash: 'hashed:realpass',
      } as any),
    });
    const rt = buildRuntime(mock);
    await expect(
      rt.runPromise(signinProgram({ email: 'a@b.com', password: 'wrongpass' }))
    ).rejects.toThrow('Email atau password salah');
  });
});

function createAuthMock(overrides: Partial<typeof IAuthRepository.Service> = {}): typeof IAuthRepository.Service {
  const defaults: typeof IAuthRepository.Service = {
    findUserByEmail: () => Effect.succeed(undefined),
    findUserByEmailOrUsername: () => Effect.succeed(undefined),
    createUser: () => Effect.succeed({ id: 'u-1', email: 'test@test.com' }),
    createSession: () => Effect.succeed({ id: 'sess-1' }),
    deleteSession: () => Effect.void,
    checkUsernameTaken: () => Effect.succeed(false),
    updateUserProfile: () => Effect.void,
    getUserProfile: () => Effect.succeed(null),
    deletePasskey: () => Effect.void,
    getPasskeys: () => Effect.succeed([]),
    savePasskeyChallenge: () => Effect.void,
    getPasskeyChallenge: () => Effect.succeed(null),
    savePasskey: () => Effect.succeed({ id: 'pk-1' }),
    getUserPasskeys: () => Effect.succeed([]),
  };
  return { ...defaults, ...overrides };
}
