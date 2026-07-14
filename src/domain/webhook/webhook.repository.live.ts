import { Layer, Effect } from "effect";
import { eq } from "drizzle-orm";
import { IWebhookRepository } from "./webhook.repository";
import { IDrizzleClient } from "@/infra/db/drizzle.client";
import { profiles, purchases, submittedSites } from "@/db/schema";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TUserProfile } from "./webhook.types";

export const WebhookRepositoryLive = Layer.effect(
  IWebhookRepository,
  Effect.gen(function* () {
    const { db } = yield* IDrizzleClient;

    return {
      updatePurchaseStatus: (invoiceId, status) => Effect.tryPromise({
        try: async () => {
          await db
            .update(purchases)
            .set({ status })
            .where(eq(purchases.xendit_invoice_id, invoiceId));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error update purchase status" })
      }),

      markSiteAsSponsored: (siteId) => Effect.tryPromise({
        try: async () => {
          await db
            .update(submittedSites)
            .set({ is_sponsored: true })
            .where(eq(submittedSites.id, siteId));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error update site sponsor status" })
      }),
      completePurchase: (invoiceId, status, siteId) => Effect.tryPromise({
        try: async () => {
          await db.transaction(async (tx) => {
            await tx
              .update(purchases)
              .set({ status })
              .where(eq(purchases.xendit_invoice_id, invoiceId));
            if (siteId) {
              await tx
                .update(submittedSites)
                .set({ is_sponsored: true })
                .where(eq(submittedSites.id, siteId));
            }
          });
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error complete purchase" })
      }),

      getUserProfile: (userId) => Effect.tryPromise({
        try: async (): Promise<TUserProfile | null> => {
          const [userProfile] = await db
            .select({
              email: profiles.email,
              full_name: profiles.full_name,
              username: profiles.username,
            })
            .from(profiles)
            .where(eq(profiles.id, userId))
            .limit(1);
          
          return userProfile || null;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get user profile" })
      }),

      getSiteTitle: (siteId) => Effect.tryPromise({
        try: async (): Promise<string | null> => {
          const [site] = await db
            .select({ title: submittedSites.title })
            .from(submittedSites)
            .where(eq(submittedSites.id, siteId))
            .limit(1);
          
          return site ? site.title : null;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get site title" })
      }),
    };
  })
);
