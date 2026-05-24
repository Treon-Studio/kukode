import { Data } from "effect";

export class InvalidEmailError extends Data.TaggedError("InvalidEmailError")<{
  readonly message: string;
}> {}
