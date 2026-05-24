import { Layer, Effect } from "effect";
import { eq, sql } from "drizzle-orm";
import { IStoreRepository } from "./store.repository";
import { IDrizzleClient } from "@/infra/db/drizzle.client";
import { purchases, submittedSites } from "@/db/schema";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";

export const StoreRepositoryLive = Layer.effect(
  IStoreRepository,
  Effect.gen(function* () {
    const { db } = yield* IDrizzleClient;

    return {
      getActiveSponsorsCount: () => Effect.tryPromise({
        try: async () => {
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(submittedSites)
            .where(eq(submittedSites.is_sponsored, true));
          return result?.count || 0;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error count sponsors" })
      }),
      recordPurchase: (params) => Effect.tryPromise({
        try: async () => {
          await db.insert(purchases).values({
            user_id: params.userId,
            store_slug: params.storeSlug,
            xendit_invoice_id: params.xenditInvoiceId,
            amount: params.amount,
            status: params.status as any,
          });
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error record purchase" })
      })
    };
  })
);
