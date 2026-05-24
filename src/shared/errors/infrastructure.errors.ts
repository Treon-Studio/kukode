import { Data } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly cause?: unknown;
  readonly message?: string;
}> {}

export class CacheError extends Data.TaggedError("CacheError")<{
  readonly cause?: unknown;
  readonly message?: string;
}> {}

export class HttpError extends Data.TaggedError("HttpError")<{
  readonly cause?: unknown;
  readonly message?: string;
  readonly statusCode?: number;
}> {}
