import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
}> {}

export class InvalidCredentialsError extends Data.TaggedError("InvalidCredentialsError")<{
  readonly message: string;
}> {}

export class EmailAlreadyExistsError extends Data.TaggedError("EmailAlreadyExistsError")<{
  readonly message: string;
}> {}

export class UsernameAlreadyExistsError extends Data.TaggedError("UsernameAlreadyExistsError")<{
  readonly message: string;
}> {}
