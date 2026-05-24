import { Context, Layer } from "effect";
import { db } from "@/db";

export class IDrizzleClient extends Context.Tag("IDrizzleClient")<
  IDrizzleClient,
  {
    readonly db: typeof db;
  }
>() {}

export const DrizzleClientLive = Layer.succeed(
  IDrizzleClient,
  { db }
);
