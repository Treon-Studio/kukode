import { Context, Effect } from "effect";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";

export interface RecordPurchaseParams {
  readonly userId: string;
  readonly storeSlug: string;
  readonly xenditInvoiceId: string;
  readonly amount: number;
  readonly status: string;
}

export class IStoreRepository extends Context.Tag("IStoreRepository")<
  IStoreRepository,
  {
    readonly getActiveSponsorsCount: () => Effect.Effect<number, DatabaseError>;
    readonly recordPurchase: (params: RecordPurchaseParams) => Effect.Effect<void, DatabaseError>;
  }
>() {}
