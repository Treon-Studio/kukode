import { Context, Effect, Layer } from "effect";
import { notifyProjectSubmission, notifyUserRegistration } from "@/lib/discord";
import { HttpError } from "@/shared/errors/infrastructure.errors";

export interface NotifyProjectSubmissionProps {
  readonly title: string;
  readonly tagline: string;
  readonly liveUrl: string;
  readonly thumbnailUrl?: string | null;
  readonly tags?: readonly string[];
  readonly makerUsername: string;
}

export interface NotifyUserRegistrationProps {
  readonly username: string;
  readonly email: string;
  readonly fullName?: string | null;
}

export class IDiscordService extends Context.Tag("IDiscordService")<
  IDiscordService,
  {
    readonly notifyProjectSubmission: (props: NotifyProjectSubmissionProps, webhookUrl?: string) => Effect.Effect<void, HttpError>;
    readonly notifyUserRegistration: (props: NotifyUserRegistrationProps, webhookUrl?: string) => Effect.Effect<void, HttpError>;
  }
>() {}

export const DiscordServiceLive = Layer.succeed(
  IDiscordService,
  {
    notifyProjectSubmission: (props, webhookUrl) =>
      Effect.tryPromise({
        try: () => notifyProjectSubmission(props as any, webhookUrl),
        catch: (e) => new HttpError({ cause: e, message: "Failed to send Discord notification" }),
      }),
    notifyUserRegistration: (props, webhookUrl) =>
      Effect.tryPromise({
        try: () => notifyUserRegistration(props, webhookUrl),
        catch: (e) => new HttpError({ cause: e, message: "Failed to send Discord notification" }),
      }),
  }
);
