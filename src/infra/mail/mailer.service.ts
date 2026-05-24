import { Context, Effect, Layer } from "effect";
import { sendEmail } from "@/lib/email";
import { HttpError } from "@/shared/errors/infrastructure.errors";

export interface SendEmailProps {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
}

export class IMailerService extends Context.Tag("IMailerService")<
  IMailerService,
  {
    readonly sendEmail: (props: SendEmailProps) => Effect.Effect<void, HttpError>;
  }
>() {}

export const MailerServiceLive = Layer.succeed(
  IMailerService,
  {
    sendEmail: (props) =>
      Effect.tryPromise({
        try: async () => {
          const res = await sendEmail(props);
          if (!res.success) throw new Error(JSON.stringify(res.error));
        },
        catch: (e) => new HttpError({ cause: e, message: "Failed to send email" }),
      }),
  }
);
