import { Effect } from "effect";
import { INewsletterRepository } from "./newsletter.repository";
import { IMailerService } from "@/infra/mail/mailer.service";
import { InvalidEmailError } from "./newsletter.errors";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TSubscribeProps } from "./newsletter.types";

export const subscribeProgram = (
  props: TSubscribeProps
): Effect.Effect<
  void,
  InvalidEmailError | DatabaseError,
  INewsletterRepository | IMailerService
> =>
  Effect.gen(function* () {
    const repo = yield* INewsletterRepository;
    const mailer = yield* IMailerService;

    if (!props.email || !props.email.includes("@")) {
      yield* Effect.fail(new InvalidEmailError({ message: "Format email tidak valid" }));
    }

    // Insert subscriber record to DB, ignoring duplicates gracefully
    yield* repo.subscribeEmail(props.email);

    // Send a welcome newsletter subscription email via Resend in the background
    const sendWelcomeEmail = mailer.sendEmail({
      to: props.email,
      subject: "Selamat Datang di Newsletter Kukode! 📬",
      html: `
        <h3>Halo!</h3>
        <p>Terima kasih telah berlangganan newsletter mingguan Kukode.</p>
        <p>Anda akan menerima kurasi berkala berisi produk digital terbaik, tren desain modern, dan inspirasi software engineering langsung di kotak masuk Anda.</p>
      `,
    }).pipe(
      Effect.catchAll((err) => Effect.sync(() => console.error("[Newsletter] Error sending welcome email:", err)))
    );

    yield* Effect.forkDaemon(sendWelcomeEmail);
  });
