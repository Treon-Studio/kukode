import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
}> {}

export class ProductNotFoundError extends Data.TaggedError("ProductNotFoundError")<{
  readonly message: string;
}> {}

export class SponsorLimitReachedError extends Data.TaggedError("SponsorLimitReachedError")<{
  readonly message: string;
}> {}
