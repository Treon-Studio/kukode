import { Context, Effect } from "effect";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";

export class INewsletterRepository extends Context.Tag("INewsletterRepository")<
  INewsletterRepository,
  {
    readonly subscribeEmail: (email: string) => Effect.Effect<void, DatabaseError>;
  }
>() {}
