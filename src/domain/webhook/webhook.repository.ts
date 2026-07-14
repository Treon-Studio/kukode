import { Context, Effect } from "effect";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TUserProfile } from "./webhook.types";

export class IWebhookRepository extends Context.Tag("IWebhookRepository")<
  IWebhookRepository,
  {
    readonly updatePurchaseStatus: (invoiceId: string, status: 'completed' | 'failed') => Effect.Effect<void, DatabaseError>;
    readonly markSiteAsSponsored: (siteId: string) => Effect.Effect<void, DatabaseError>;
    readonly completePurchase: (invoiceId: string, status: 'completed' | 'failed', siteId?: string) => Effect.Effect<void, DatabaseError>;
    readonly findPurchase: (invoiceId: string) => Effect.Effect<{ status: string } | undefined, DatabaseError>;
    readonly getUserProfile: (userId: string) => Effect.Effect<TUserProfile | null, DatabaseError>;
    readonly getSiteTitle: (siteId: string) => Effect.Effect<string | null, DatabaseError>;
  }
>() {}
