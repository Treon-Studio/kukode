import { Effect } from "effect";
import { IAnalyticsRepository } from "./analytics.repository";
import { ICacheAdapter } from "@/infra/cache/cache.adapter";
import type { TAnalyticsEventProps, TPlatformStats } from "./analytics.types";
import type { DatabaseError, CacheError } from "@/shared/errors/infrastructure.errors";

export const recordEventProgram = (
  props: TAnalyticsEventProps
): Effect.Effect<void, DatabaseError | CacheError, IAnalyticsRepository | ICacheAdapter> =>
  Effect.gen(function* () {
    const repo = yield* IAnalyticsRepository;
    const cache = yield* ICacheAdapter;

    // 1. Record event in Turso Database
    yield* repo.saveEvent(props);

    // 2. Record unique user tracking via HyperLogLog in Redis
    const identifier = props.userId || props.ip || "anonymous";
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const monthStr = todayStr.substring(0, 7); // YYYY-MM

    const dauKey = `dau:${todayStr}`;
    const mauKey = `mau:${monthStr}`;

    yield* Effect.all([
      cache.pfadd(dauKey, identifier),
      cache.pfadd(mauKey, identifier)
    ], { concurrency: "unbounded" });
  });

export const getPlatformStatsProgram = (): Effect.Effect<TPlatformStats, CacheError, ICacheAdapter> =>
  Effect.gen(function* () {
    const cache = yield* ICacheAdapter;
    
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const monthStr = todayStr.substring(0, 7); // YYYY-MM

    const [dau, mau] = yield* Effect.all([
      cache.pfcount(`dau:${todayStr}`),
      cache.pfcount(`mau:${monthStr}`)
    ], { concurrency: "unbounded" });

    return { dau, mau };
  });
