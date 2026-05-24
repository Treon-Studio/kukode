import { Context, Effect } from "effect";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";

export interface CreateUserParams {
  readonly email: string;
  readonly passwordHash: string;
  readonly username: string;
  readonly fullName: string | null;
  readonly avatarUrl?: string | null;
  readonly role: string;
  readonly preferredLang: string;
}

export class IAuthRepository extends Context.Tag("IAuthRepository")<
  IAuthRepository,
  {
    readonly findUserByEmail: (email: string) => Effect.Effect<{
      id: string;
      password_hash: string;
      preferred_lang: string | null;
    } | undefined, DatabaseError>;
    
    readonly findUserByEmailOrUsername: (email: string, username: string) => Effect.Effect<{
      id: string;
      email: string;
      username: string | null;
    } | undefined, DatabaseError>;
    
    readonly createUser: (params: CreateUserParams) => Effect.Effect<{
      id: string;
      email: string;
      username: string | null;
      full_name: string | null;
    }, DatabaseError>;
    
    readonly createSession: (userId: string, expiresAt: number) => Effect.Effect<{
      id: string;
    }, DatabaseError>;
    
    readonly deleteSession: (sessionId: string) => Effect.Effect<void, DatabaseError>;

    readonly checkUsernameTaken: (username: string, excludeUserId: string) => Effect.Effect<boolean, DatabaseError>;

    readonly updateUserProfile: (userId: string, updates: {
      full_name?: string;
      username?: string;
      avatar_url?: string;
      bio?: string;
      website?: string;
      twitter?: string;
      github?: string;
    }) => Effect.Effect<void, DatabaseError>;

    readonly getUserProfile: (userId: string) => Effect.Effect<{
      id: string;
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      bio: string | null;
      website: string | null;
      twitter: string | null;
      github: string | null;
      preferred_lang: string | null;
    } | undefined, DatabaseError>;

    readonly deletePasskey: (id: string, userId: string) => Effect.Effect<void, DatabaseError>;
    
    readonly getPasskeyByCredentialId: (credentialId: string) => Effect.Effect<{
      id: string;
      user_id: string;
      credential_id: string;
      public_key: string;
      counter: number;
      transports: string | null;
    } | undefined, DatabaseError>;

    readonly getPasskeysByUserId: (userId: string) => Effect.Effect<Array<{
      id: string;
      credential_id: string;
      public_key: string;
      counter: number;
      transports: string | null;
    }>, DatabaseError>;

    readonly updatePasskeyCounter: (id: string, counter: number) => Effect.Effect<void, DatabaseError>;

    readonly createPasskey: (params: {
      userId: string;
      credentialId: string;
      publicKey: string;
      counter: number;
      transports: string | null;
    }) => Effect.Effect<void, DatabaseError>;
  }
>() {}
