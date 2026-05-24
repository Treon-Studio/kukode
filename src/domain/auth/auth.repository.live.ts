import { Layer, Effect } from "effect";
import { eq, or, and } from "drizzle-orm";
import { IAuthRepository } from "./auth.repository";
import { IDrizzleClient } from "@/infra/db/drizzle.client";
import { profiles, sessions, passkeys } from "@/db/schema";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";

export const AuthRepositoryLive = Layer.effect(
  IAuthRepository,
  Effect.gen(function* () {
    const { db } = yield* IDrizzleClient;

    return {
      findUserByEmail: (email) => Effect.tryPromise({
        try: async () => {
          const [user] = await db.select({
            id: profiles.id,
            password_hash: profiles.password_hash,
            preferred_lang: profiles.preferred_lang
          }).from(profiles).where(eq(profiles.email, email)).limit(1);
          return user;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error findUserByEmail" })
      }),
      
      findUserByEmailOrUsername: (email, username) => Effect.tryPromise({
        try: async () => {
          const [existing] = await db
            .select({
              id: profiles.id,
              email: profiles.email,
              username: profiles.username,
              preferred_lang: profiles.preferred_lang
            })
            .from(profiles)
            .where(or(eq(profiles.email, email), eq(profiles.username, username)))
            .limit(1);
          return existing;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error findUserByEmailOrUsername" })
      }),

      createUser: (params) => Effect.tryPromise({
        try: async () => {
          const [newUser] = await db
            .insert(profiles)
            .values({
              email: params.email,
              password_hash: params.passwordHash,
              username: params.username,
              full_name: params.fullName,
              avatar_url: params.avatarUrl,
              role: params.role,
              preferred_lang: params.preferredLang,
            })
            .returning({
              id: profiles.id,
              email: profiles.email,
              username: profiles.username,
              full_name: profiles.full_name
            });
          return newUser;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error createUser" })
      }),

      createSession: (userId, expiresAt) => Effect.tryPromise({
        try: async () => {
          const [newSession] = await db
            .insert(sessions)
            .values({
              user_id: userId,
              expires_at: expiresAt,
            })
            .returning({ id: sessions.id });
          return newSession;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error createSession" })
      }),

      deleteSession: (sessionId) => Effect.tryPromise({
        try: async () => {
          await db.delete(sessions).where(eq(sessions.id, sessionId));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error deleteSession" })
      }),

      checkUsernameTaken: (username, excludeUserId) => Effect.tryPromise({
        try: async () => {
          const { ne, and } = await import("drizzle-orm");
          const [existing] = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(and(eq(profiles.username, username), ne(profiles.id, excludeUserId)))
            .limit(1);
          return !!existing;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error checkUsernameTaken" })
      }),

      updateUserProfile: (userId, updates) => Effect.tryPromise({
        try: async () => {
          await db
            .update(profiles)
            .set(updates)
            .where(eq(profiles.id, userId));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error updateUserProfile" })
      }),

      getUserProfile: (userId) => Effect.tryPromise({
        try: async () => {
          const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
          return profile;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error getUserProfile" })
      }),

      deletePasskey: (id, userId) =>
        Effect.tryPromise({
          try: async () => {
            await db.delete(passkeys).where(and(eq(passkeys.id, id), eq(passkeys.user_id, userId)));
          },
          catch: (e) => new DatabaseError({ message: `deletePasskey failed: ${e}` })
        }),

      getPasskeyByCredentialId: (credentialId) =>
        Effect.tryPromise({
          try: async () => {
            const [passkey] = await db
              .select({
                id: passkeys.id,
                user_id: passkeys.user_id,
                credential_id: passkeys.credential_id,
                public_key: passkeys.public_key,
                counter: passkeys.counter,
                transports: passkeys.transports,
              })
              .from(passkeys)
              .where(eq(passkeys.credential_id, credentialId))
              .limit(1);
            return passkey;
          },
          catch: (e) => new DatabaseError({ message: `getPasskeyByCredentialId failed: ${e}` })
        }),

      getPasskeysByUserId: (userId) =>
        Effect.tryPromise({
          try: async () => {
            const results = await db
              .select({
                id: passkeys.id,
                credential_id: passkeys.credential_id,
                public_key: passkeys.public_key,
                counter: passkeys.counter,
                transports: passkeys.transports,
              })
              .from(passkeys)
              .where(eq(passkeys.user_id, userId));
            return results;
          },
          catch: (e) => new DatabaseError({ message: `getPasskeysByUserId failed: ${e}` })
        }),

      updatePasskeyCounter: (id, counter) =>
        Effect.tryPromise({
          try: async () => {
            await db
              .update(passkeys)
              .set({ counter })
              .where(eq(passkeys.id, id));
          },
          catch: (e) => new DatabaseError({ message: `updatePasskeyCounter failed: ${e}` })
        }),

      createPasskey: (params) =>
        Effect.tryPromise({
          try: async () => {
            await db.insert(passkeys).values({
              user_id: params.userId,
              credential_id: params.credentialId,
              public_key: params.publicKey,
              counter: params.counter,
              transports: params.transports,
            });
          },
          catch: (e) => new DatabaseError({ message: `createPasskey failed: ${e}` })
        })
    };
  })
);
