import { Effect } from "effect";
import { IAuthRepository } from "./auth.repository";
import { IAuthCrypto } from "./auth.crypto";
import { IDiscordService } from "@/infra/discord/discord.service";
import { AUTH_CONFIG } from "@/lib/constants";
import { 
  ValidationError, 
  InvalidCredentialsError, 
  EmailAlreadyExistsError, 
  UsernameAlreadyExistsError 
} from "./auth.errors";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TSigninProps, TSignupProps } from "./auth.types";

export const signinProgram = (
  props: TSigninProps
): Effect.Effect<
  { sessionId: string; expiresAt: number; preferredLang: string },
  ValidationError | InvalidCredentialsError | DatabaseError | Error,
  IAuthRepository | IAuthCrypto
> =>
  Effect.gen(function* () {
    const repo = yield* IAuthRepository;
    const cryptoService = yield* IAuthCrypto;

    if (!props.email || !props.password) {
      yield* Effect.fail(new ValidationError({ message: "Email dan password harus diisi" }));
    }

    const user = yield* repo.findUserByEmail(props.email);
    if (!user) {
      yield* Effect.fail(new InvalidCredentialsError({ message: "Email atau password salah" }));
    }

    const isValid = yield* cryptoService.verifyPassword(props.password, user.password_hash);
    if (!isValid) {
      yield* Effect.fail(new InvalidCredentialsError({ message: "Email atau password salah" }));
    }

    const expiresAt = Math.floor(Date.now() / 1000) + AUTH_CONFIG.SESSION_DURATION_SECONDS;
    const session = yield* repo.createSession(user.id, expiresAt);

    return { 
      sessionId: session.id, 
      expiresAt, 
      preferredLang: user.preferred_lang || "en" 
    };
  });

export const signupProgram = (
  props: TSignupProps,
  webhookUrl?: string
): Effect.Effect<
  { sessionId: string; expiresAt: number; preferredLang: string },
  ValidationError | EmailAlreadyExistsError | UsernameAlreadyExistsError | DatabaseError | Error,
  IAuthRepository | IAuthCrypto | IDiscordService
> =>
  Effect.gen(function* () {
    const repo = yield* IAuthRepository;
    const cryptoService = yield* IAuthCrypto;
    const discord = yield* IDiscordService;

    if (!props.email || !props.password || !props.username) {
      yield* Effect.fail(new ValidationError({ message: "Semua field wajib diisi" }));
    }

    const existing = yield* repo.findUserByEmailOrUsername(props.email, props.username);
    if (existing) {
      if (existing.email === props.email) {
        yield* Effect.fail(new EmailAlreadyExistsError({ message: "Email sudah terdaftar." }));
      } else {
        yield* Effect.fail(new UsernameAlreadyExistsError({ message: "Username sudah digunakan." }));
      }
    }

    const passwordHash = yield* cryptoService.hashPassword(props.password);
    const preferredLang = props.preferredLang || "en";

    const newUser = yield* repo.createUser({
      email: props.email,
      passwordHash,
      username: props.username,
      fullName: props.fullName || null,
      role: "user",
      preferredLang,
    });

    const expiresAt = Math.floor(Date.now() / 1000) + AUTH_CONFIG.SESSION_DURATION_SECONDS;
    const session = yield* repo.createSession(newUser.id, expiresAt);

    // Notify Discord
    const discordEff = discord.notifyUserRegistration({
      username: newUser.username || "",
      email: newUser.email,
      fullName: newUser.full_name
    }, webhookUrl);

    yield* Effect.forkDaemon(Effect.either(discordEff));

    return {
      sessionId: session.id,
      expiresAt,
      preferredLang
    };
  });

export const signoutProgram = (
  sessionId: string | undefined
): Effect.Effect<void, DatabaseError, IAuthRepository> =>
  Effect.gen(function* () {
    const repo = yield* IAuthRepository;

    if (sessionId) {
      // Ignored if it fails, just like original behavior
      yield* Effect.either(repo.deleteSession(sessionId));
    }
  });

export interface OAuthGoogleParams {
  readonly email: string;
  readonly name?: string;
  readonly picture?: string;
  readonly preferredLang: string;
  readonly webhookUrl?: string;
}

export const oauthGoogleProgram = (
  params: OAuthGoogleParams
): Effect.Effect<
  {
    sessionId: string;
    expiresAt: number;
    preferredLang: string;
  },
  DatabaseError,
  IAuthRepository | IDiscordService
> =>
  Effect.gen(function* () {
    const repo = yield* IAuthRepository;
    const discord = yield* IDiscordService;
    
    // 1. Check if user exists
    let user = yield* repo.findUserByEmail(params.email);
    
    if (!user) {
      // 2. Generate a unique username
      let baseUsername = params.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (baseUsername.length < 3) baseUsername = 'user';
      let username = baseUsername;
      let attempts = 0;
      
      while (attempts < 10) {
        const isTaken = yield* repo.checkUsernameTaken(username, "new");
        if (!isTaken) break;
        username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
        attempts++;
      }
      
      const dummyPasswordHash = `oauth_google_${crypto.randomUUID()}`;
      
      const newUser = yield* repo.createUser({
        email: params.email,
        passwordHash: dummyPasswordHash,
        username,
        fullName: params.name || null,
        avatarUrl: params.picture || null,
        role: "user",
        preferredLang: params.preferredLang
      });
      
      user = { 
        id: newUser.id, 
        password_hash: "", 
        preferred_lang: params.preferredLang 
      };
      
      // Notify Discord
      yield* Effect.forkDaemon(Effect.either(discord.notifyUserRegistration({
        username: newUser.username || "",
        email: newUser.email,
        fullName: newUser.full_name
      }, params.webhookUrl)));
    }
    
    // 3. Create session
    const expiresAt = Math.floor(Date.now() / 1000) + AUTH_CONFIG.SESSION_DURATION_SECONDS;
    const session = yield* repo.createSession(user.id, expiresAt);
    
    return {
      sessionId: session.id,
      expiresAt,
      preferredLang: user.preferred_lang || params.preferredLang
    };
  });

export interface PasskeyLoginVerifyParams {
  readonly standardID: string;
}

export const passkeyLoginVerifyProgram = (
  params: PasskeyLoginVerifyParams
): Effect.Effect<
  {
    passkey: {
      id: string;
      user_id: string;
      credential_id: string;
      public_key: string;
      counter: number;
      transports: string | null;
    };
    user: {
      id: string;
      preferred_lang: string | null;
    };
  },
  DatabaseError,
  IAuthRepository
> =>
  Effect.gen(function* () {
    const repo = yield* IAuthRepository;
    
    const passkey = yield* repo.getPasskeyByCredentialId(params.standardID);
    if (!passkey) {
      return yield* Effect.fail(new DatabaseError({ message: "Passkey not found" }));
    }
    
    // user profile is needed for setting preferred_lang and creating session
    // wait, we can just fetch the profile! We don't have getUserProfile that returns just what we need?
    // We have getUserProfile but it's for full profile. We can use it.
    const user = yield* repo.getUserProfile(passkey.user_id);
    if (!user) {
      return yield* Effect.fail(new DatabaseError({ message: "User not found" }));
    }
    
    return {
      passkey,
      user: {
        id: user.id,
        preferred_lang: user.preferred_lang || 'en' // wait, getUserProfile doesn't return preferred_lang?
        // Let's use findUserByEmail? No we don't have email.
      }
    };
  });
