import { Effect } from "effect";
import { IAdminRepository } from "./admin.repository";
import { IMailerService } from "@/infra/mail/mailer.service";
import { APP_CONFIG } from "@/lib/constants";
import { UnauthorizedError, NotFoundError, InvalidActionError } from "./admin.errors";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { 
  TApproveSiteProps, 
  TRejectSiteProps, 
  TManageFlagProps, 
  TManageReportProps 
} from "./admin.types";

const checkAdminAuth = (user: any, profile: any) => 
  Effect.gen(function* () {
    if (!user || profile?.role !== "admin") {
      yield* Effect.fail(new UnauthorizedError({ message: "Unauthorized" }));
    }
  });

export const approveSiteProgram = (
  props: TApproveSiteProps,
  user: any,
  profile: any
): Effect.Effect<
  void,
  UnauthorizedError | NotFoundError | DatabaseError,
  IAdminRepository | IMailerService
> =>
  Effect.gen(function* () {
    yield* checkAdminAuth(user, profile);

    if (!props.site_id) {
      yield* Effect.fail(new NotFoundError({ message: "site_id required" }));
    }

    const repo = yield* IAdminRepository;
    const mailer = yield* IMailerService;

    const site = yield* repo.approveSite(props.site_id);
    if (!site) {
      yield* Effect.fail(new NotFoundError({ message: "Site not found or already processed" }));
    }

    if (site.maker?.email) {
      const sendWelcomeEmail = mailer.sendEmail({
        to: site.maker.email,
        subject: `Produk Kamu Telah Di-Approve! 🎉`,
        html: `
          <h3>Selamat, ${site.maker.full_name || site.maker.username}!</h3>
          <p>Produk kamu <strong>${site.title}</strong> telah di-approve dan sekarang live di Kukode.</p>
          <p><a href="${APP_CONFIG.BASE_URL}/sites/site/${props.site_id}">Lihat produk kamu di sini</a></p>
        `,
      }).pipe(
        Effect.catchAll((err) => Effect.sync(() => console.error("[Admin] Error sending approval email:", err)))
      );
  
      yield* Effect.forkDaemon(sendWelcomeEmail);
    }
  });

export const rejectSiteProgram = (
  props: TRejectSiteProps,
  user: any,
  profile: any
): Effect.Effect<
  void,
  UnauthorizedError | NotFoundError | DatabaseError,
  IAdminRepository | IMailerService
> =>
  Effect.gen(function* () {
    yield* checkAdminAuth(user, profile);

    if (!props.site_id || !props.reason) {
      yield* Effect.fail(new NotFoundError({ message: "site_id and reason required" }));
    }

    const repo = yield* IAdminRepository;
    const mailer = yield* IMailerService;

    const site = yield* repo.rejectSite(props.site_id, props.reason);
    if (!site) {
      yield* Effect.fail(new NotFoundError({ message: "Site not found or already processed" }));
    }

    if (site.maker?.email) {
      const sendRejectionEmail = mailer.sendEmail({
        to: site.maker.email,
        subject: `Status Submission Produk: ${site.title}`,
        html: `
          <h3>Halo, ${site.maker.full_name || site.maker.username}</h3>
          <p>Terima kasih telah mensubmit produk <strong>${site.title}</strong> ke Kukode.</p>
          <p>Sayangnya, produk kamu belum dapat kami setujui saat ini. Berikut adalah alasan penolakan dari tim moderator:</p>
          <blockquote style="border-left: 4px solid #ef4444; padding-left: 1rem; color: #4b5563;">
            ${props.reason.trim()}
          </blockquote>
          <p>Kamu bisa memperbaiki produk kamu dan melakukan submit ulang di kemudian hari.</p>
        `,
      }).pipe(
        Effect.catchAll((err) => Effect.sync(() => console.error("[Admin] Error sending rejection email:", err)))
      );
  
      yield* Effect.forkDaemon(sendRejectionEmail);
    }
  });

export const manageFlagProgram = (
  props: TManageFlagProps,
  user: any,
  profile: any
): Effect.Effect<
  any,
  UnauthorizedError | NotFoundError | InvalidActionError | DatabaseError,
  IAdminRepository
> =>
  Effect.gen(function* () {
    yield* checkAdminAuth(user, profile);

    const repo = yield* IAdminRepository;

    const result = yield* repo.manageFlag(props);
    if (result === null) {
      if (props.action === "toggle" || props.action === "update" || props.action === "delete") {
         yield* Effect.fail(new NotFoundError({ message: "Flag not found" }));
      } else {
         yield* Effect.fail(new InvalidActionError({ message: "Invalid action" }));
      }
    }

    return result;
  });

export const manageReportProgram = (
  props: TManageReportProps,
  user: any,
  profile: any
): Effect.Effect<
  { success: boolean; message: string },
  UnauthorizedError | NotFoundError | InvalidActionError | DatabaseError,
  IAdminRepository
> =>
  Effect.gen(function* () {
    yield* checkAdminAuth(user, profile);

    if (!props.report_id || !props.action) {
      yield* Effect.fail(new NotFoundError({ message: "Report ID and action are required" }));
    }

    const repo = yield* IAdminRepository;

    const report = yield* repo.fetchReport(props.report_id);
    if (!report) {
      yield* Effect.fail(new NotFoundError({ message: "Report not found" }));
    }

    if (props.action === "delete") {
      yield* repo.deleteComment(report.comment_id);
      return { success: true, message: "Comment deleted successfully" };
    }

    if (props.action === "dismiss") {
      yield* repo.dismissReport(props.report_id);
      return { success: true, message: "Report dismissed successfully" };
    }

    yield* Effect.fail(new InvalidActionError({ message: "Invalid action" }));
  });
