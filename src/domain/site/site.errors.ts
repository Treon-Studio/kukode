import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
}> {}

export class SiteNotFoundError extends Data.TaggedError("SiteNotFoundError")<{
  readonly message: string;
}> {}

export class DuplicateSiteError extends Data.TaggedError("DuplicateSiteError")<{
  readonly message: string;
}> {}

export class MakerCannotVoteError extends Data.TaggedError("MakerCannotVoteError")<{
  readonly message: string;
}> {}
