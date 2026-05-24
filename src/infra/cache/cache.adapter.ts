import { Context, Layer, Effect } from "effect";
import { getRedis } from "@/lib/ratelimit";
import { CacheError } from "@/shared/errors/infrastructure.errors";

export class ICacheAdapter extends Context.Tag("ICacheAdapter")<
  ICacheAdapter,
  {
    readonly pfadd: (key: string, element: string) => Effect.Effect<void, CacheError>;
    readonly pfcount: (key: string) => Effect.Effect<number, CacheError>;
  }
>() {}

export const createCacheAdapterLive = (env?: any) =>
  Layer.succeed(
    ICacheAdapter,
    {
      pfadd: (key: string, element: string) =>
        Effect.tryPromise({
          try: async () => {
            const redis = getRedis(env);
            if (!redis) return;
            await redis.pfadd(key, element);
          },
          catch: (e) => new CacheError({ cause: e, message: "pfadd failed" }),
        }),
      pfcount: (key: string) =>
        Effect.tryPromise({
          try: async () => {
            const redis = getRedis(env);
            if (!redis) return 0;
            return await redis.pfcount(key);
          },
          catch: (e) => new CacheError({ cause: e, message: "pfcount failed" }),
        }),
    }
  );
