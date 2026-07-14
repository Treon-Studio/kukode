import { Effect } from "effect";
import { IWebhookRepository } from "./webhook.repository";
import { IMailerService } from "@/infra/mail/mailer.service";
import { APP_CONFIG } from "@/lib/constants";
import { UnauthorizedError, ValidationError } from "./webhook.errors";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TXenditCallbackPayload } from "./webhook.types";

export const processXenditCallbackProgram = (
  payload: TXenditCallbackPayload,
  requestToken: string | null,
  callbackToken: string | undefined
): Effect.Effect<
  { success: boolean },
  UnauthorizedError | ValidationError | DatabaseError,
  IWebhookRepository | IMailerService
> =>
  Effect.gen(function* () {
    if (callbackToken && requestToken !== callbackToken) {
      yield* Effect.fail(new UnauthorizedError({ message: "Unauthorized" }));
    }

    if (!payload.id || !payload.external_id || !payload.status) {
      yield* Effect.fail(new ValidationError({ message: "Missing required payload fields" }));
    }

    const repo = yield* IWebhookRepository;
    const mailer = yield* IMailerService;

    if (payload.status === "PAID") {
      const parts = payload.external_id.split('_');
      const siteId = (parts[0] === 'adv') ? parts[3] : undefined;

      // Atomic: update purchase + mark sponsored in one db.transaction
      yield* repo.completePurchase(payload.id, "completed", siteId);

      if (parts[0] === 'adv') {
        const pkg = parts[1] || 'sponsored';
        const userId = parts[2];

        if (userId) {
          const userProfile = yield* repo.getUserProfile(userId);

          let siteTitle = 'Produk Anda';
          if (siteId) {
            const fetchedTitle = yield* repo.getSiteTitle(siteId);
            if (fetchedTitle) siteTitle = fetchedTitle;
          }

          if (userProfile?.email) {
            const sendAdvEmail = mailer.sendEmail({
              to: userProfile.email,
              subject: `Pembayaran Sponsor Aktif: ${siteTitle} 🚀`,
              html: `
                <h3>Halo, ${userProfile.full_name || userProfile.username}!</h3>
                <p>Terima kasih! Pembayaran Anda untuk paket promosi <strong>${pkg}</strong> telah berhasil kami terima.</p>
                <p>Status promosi produk Anda <strong>${siteTitle}</strong> kini telah aktif dan ditampilkan sebagai Sponsored Listing di halaman depan Kukode.</p>
              `,
            }).pipe(
              Effect.catchAll((err) => Effect.sync(() => console.error("[Notification] Error sending sponsor payment email:", err)))
            );

            yield* Effect.forkDaemon(sendAdvEmail);
          }
        }
      } else if (parts[0] === 'store') {
        const storeSlug = parts[1];
        const userId = parts[2];

        if (userId && storeSlug) {
          const userProfile = yield* repo.getUserProfile(userId);

          if (userProfile?.email) {
            const sendStoreEmail = mailer.sendEmail({
              to: userProfile.email,
              subject: `Pembelian Sukses: Template ${storeSlug} 🛒`,
              html: `
                <h3>Halo, ${userProfile.full_name || userProfile.username}!</h3>
                <p>Terima kasih atas pembelian Anda! Pembayaran Anda untuk template digital <strong>${storeSlug}</strong> telah berhasil kami terima.</p>
                <p>Anda dapat mengakses berkas unduhan/akses produk digital Anda langsung melalui tautan berikut:</p>
                <p><a href="${APP_CONFIG.BASE_URL}/store" style="display: inline-block; padding: 0.5rem 1rem; background-color: #10b981; color: white; text-decoration: none; border-radius: 0.375rem; font-weight: 500;">Akses Halaman Toko</a></p>
              `,
            }).pipe(
              Effect.catchAll((err) => Effect.sync(() => console.error("[Notification] Error sending store purchase email:", err)))
            );

            yield* Effect.forkDaemon(sendStoreEmail);
          }
        }
      }
    } else if (payload.status === "EXPIRED" || payload.status === "FAILED") {
      yield* repo.updatePurchaseStatus(payload.id, "failed");
    }

    return { success: true };
  });
