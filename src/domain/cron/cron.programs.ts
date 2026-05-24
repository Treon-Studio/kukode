import { Effect } from "effect";
import { ICronRepository } from "./cron.repository";
import { IMailerService } from "@/infra/mail/mailer.service";
import { APP_CONFIG } from "@/lib/constants";
import { UnauthorizedError } from "./cron.errors";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TPotdResult } from "./cron.types";

export const calculatePotdProgram = (
  authHeader: string | null,
  cronSecret: string | undefined
): Effect.Effect<
  TPotdResult,
  UnauthorizedError | DatabaseError,
  ICronRepository | IMailerService
> =>
  Effect.gen(function* () {
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      yield* Effect.fail(new UnauthorizedError({ message: "Unauthorized" }));
    }

    const repo = yield* ICronRepository;
    const mailer = yield* IMailerService;

    let winningSiteId: string | null = null;
    let winningVotes = 0;

    const topVoted = yield* repo.getTopVotedToday();
    
    if (topVoted) {
      winningSiteId = topVoted.site_id;
      winningVotes = topVoted.vote_count;
    } else {
      const fallback = yield* repo.getFallbackWinner();
      if (fallback) {
        winningSiteId = fallback.site_id;
        winningVotes = fallback.vote_count;
      }
    }

    if (!winningSiteId) {
      return { success: false, message: "No approved sites available to designate as POTD" };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    yield* repo.savePotdWinner(winningSiteId, todayStr, winningVotes);

    const siteInfo = yield* repo.getSiteInfo(winningSiteId);

    if (siteInfo?.maker_email) {
      const sendPotdEmail = mailer.sendEmail({
        to: siteInfo.maker_email,
        subject: `Selamat! Produk Anda terpilih sebagai Product of the Day! 🏆`,
        html: `
          <h3>Selamat, ${siteInfo.maker_name || siteInfo.maker_username}!</h3>
          <p>Produk Anda <strong>${siteInfo.title}</strong> telah resmi terpilih sebagai <strong>Product of the Day (POTD)</strong> hari ini di Kukode dengan total <strong>${winningVotes}</strong> suara harian!</p>
          <p>Produk Anda sekarang ditampilkan di bagian atas halaman beranda Kukode untuk mendapatkan eksposur maksimal.</p>
          <p><a href="${APP_CONFIG.BASE_URL}/sites/site/${winningSiteId}" style="display: inline-block; padding: 0.5rem 1rem; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 0.375rem; font-weight: 500;">Lihat Produk Anda di Kukode</a></p>
        `,
      }).pipe(
        Effect.catchAll((err) => Effect.sync(() => console.error("[Notification] Error sending POTD email:", err)))
      );
  
      yield* Effect.forkDaemon(sendPotdEmail);
    }

    return {
      success: true,
      date: todayStr,
      site_id: winningSiteId,
      site_title: siteInfo?.title || 'Unknown',
      vote_count: winningVotes,
    };
  });
