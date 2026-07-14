import { Effect } from "effect";
import { ISiteRepository } from "./site.repository";
import { IMailerService } from "@/infra/mail/mailer.service";
import { IDiscordService } from "@/infra/discord/discord.service";
import { StorageAdapter } from "@/lib/storage";
import { isEnabled } from "@/lib/flags";
import { APP_CONFIG, NOTIFICATION_CONFIG } from "@/lib/constants";
import { 
  ValidationError, 
  SiteNotFoundError, 
  DuplicateSiteError, 
  MakerCannotVoteError 
} from "./site.errors";
import { DatabaseError, HttpError } from "@/shared/errors/infrastructure.errors";
import { StorageError } from "@/lib/storage";
import type { TSubmitSiteProps, TVoteSiteProps, TCommentSiteProps } from "./site.types";

export const submitSiteProgram = (
  props: TSubmitSiteProps,
  user: any,
  profile: any,
  locals: any
): Effect.Effect<
  void, 
  ValidationError | DuplicateSiteError | DatabaseError | HttpError | StorageError | Error, 
  ISiteRepository | IMailerService | IDiscordService | StorageAdapter
> =>
  Effect.gen(function* () {
    const repo = yield* ISiteRepository;
    const mailer = yield* IMailerService;
    const discord = yield* IDiscordService;
    const storage = yield* StorageAdapter;

    // Validation
    if (!props.title || !props.tagline || !props.liveUrl || !props.description) {
      yield* Effect.fail(new ValidationError({ message: "Semua field wajib diisi" }));
    }
    if ((!props.thumbnailUrl || props.thumbnailUrl === "") && (!props.thumbnailFile || props.thumbnailFile.size === 0)) {
      yield* Effect.fail(new ValidationError({ message: "Thumbnail produk wajib diisi" }));
    }
    if (props.tagline.length > 60) {
      yield* Effect.fail(new ValidationError({ message: "Tagline maksimal 60 karakter" }));
    }

    const tags = props.tagsRaw ? props.tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];

    // Duplicate check
    const existing = yield* repo.existsByUrl(props.liveUrl);
    if (existing) {
      yield* Effect.fail(new DuplicateSiteError({ message: "Produk ini sudah pernah disubmit." }));
    }

    // Process file upload if provided
    let finalThumbnailUrl = props.thumbnailUrl || null;
    if (props.thumbnailFile && props.thumbnailFile.size > 0) {
      const result = yield* storage.uploadFile(props.thumbnailFile, "sites");
      finalThumbnailUrl = result.url;
    }

    // Auto-approve logic
    let status = "pending_review";
    let approvedAt: string | null = null;
    
    const autoApproveEnabled = yield* Effect.tryPromise({
      try: () => isEnabled("auto_approve", { userId: user.id }),
      catch: (e) => new DatabaseError({ cause: e, message: "Failed to check auto_approve flag" })
    });
    if (autoApproveEnabled && finalThumbnailUrl) {
      const isLive = yield* Effect.tryPromise({
        try: async () => {
          const res = await fetch(props.liveUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
          return res.ok;
        },
        catch: (e) => new HttpError({ cause: e, message: "Failed to fetch live URL" })
      }).pipe(Effect.catchAll(() => Effect.succeed(false)));
      if (isLive) {
        status = "approved";
        approvedAt = new Date().toISOString();
      }
    }

    // Insert to DB + upgrade role (atomic via db.transaction in saveSiteWithUpgrade)
    if (profile?.role === "user") {
      yield* repo.saveSiteWithUpgrade({
        makerId: user.id,
        title: props.title,
        tagline: props.tagline,
        description: props.description,
        liveUrl: props.liveUrl,
        thumbnailUrl: finalThumbnailUrl,
        tags,
        status,
        approvedAt
      }, user.id);
    } else {
      yield* repo.saveSite({
        makerId: user.id,
        title: props.title,
        tagline: props.tagline,
        description: props.description,
        liveUrl: props.liveUrl,
        thumbnailUrl: finalThumbnailUrl,
        tags,
        status,
        approvedAt
      });
    }

    // Notifications (Fire and forget style using forkDaemon)
    const adminEmail = mailer.sendEmail({
      to: NOTIFICATION_CONFIG.ADMIN_EMAIL,
      subject: `New Product Submitted: ${props.title}`,
      html: `
        <h3>New Product Submission</h3>
        <p><strong>Title:</strong> ${props.title}</p>
        <p><strong>Tagline:</strong> ${props.tagline}</p>
        <p><strong>Live URL:</strong> <a href="${props.liveUrl}">${props.liveUrl}</a></p>
        <p><strong>Maker:</strong> ${profile?.username || user.email}</p>
        <p>Please review it in the <a href="${APP_CONFIG.BASE_URL}/admin/products">Admin Panel</a>.</p>
      `
    });

    const makerEmail = user.email ? mailer.sendEmail({
      to: user.email,
      subject: `Submission Berhasil: ${props.title} 🚀`,
      html: `
        <h3>Halo, ${profile?.full_name || profile?.username || 'Maker'}!</h3>
        <p>Terima kasih telah mensubmit produk <strong>${props.title}</strong> ke Kukode.</p>
        <p>Status submission Anda saat ini adalah <strong>${status === 'approved' ? 'Disetujui (Auto-Approved)' : 'Menunggu Review'}</strong>.</p>
        <p>Kami akan meninjau produk Anda secepatnya dan mengirimkan email konfirmasi lanjutan setelah status diperbarui.</p>
      `
    }) : Effect.void;

    const discordHook = discord.notifyProjectSubmission({
      title: props.title,
      tagline: props.tagline,
      liveUrl: props.liveUrl,
      thumbnailUrl: finalThumbnailUrl,
      tags,
      makerUsername: profile?.username || user.email || 'anonymous'
    }, locals?.runtime?.env?.DISCORD_WEBHOOK_URL);

    // Fire all notifications concurrently and ignore failures so it doesn't block
    yield* Effect.forkDaemon(Effect.all([Effect.either(adminEmail), Effect.either(makerEmail), Effect.either(discordHook)], { concurrency: "unbounded" }));
  });

export const voteSiteProgram = (
  props: TVoteSiteProps,
  userId: string
): Effect.Effect<
  { voted: boolean; voteCount: number },
  ValidationError | SiteNotFoundError | MakerCannotVoteError | DatabaseError,
  ISiteRepository
> =>
  Effect.gen(function* () {
    const repo = yield* ISiteRepository;

    if (!props.siteId) {
      yield* Effect.fail(new ValidationError({ message: "site_id required" }));
    }

    const site = yield* repo.findSiteForVote(props.siteId);
    if (!site) {
      yield* Effect.fail(new SiteNotFoundError({ message: "Site not found" }));
    }

    if (site.maker_id === userId) {
      yield* Effect.fail(new MakerCannotVoteError({ message: "Pembuat produk tidak dapat melakukan upvote" }));
    }

    // toggleVote wraps find → save/delete → count in a single db.transaction()
    // eliminating the race condition between read and write.
    return yield* repo.toggleVote(userId, props.siteId);
  });

export const commentSiteProgram = (
  props: TCommentSiteProps,
  userId: string
): Effect.Effect<
  void,
  ValidationError | DatabaseError | HttpError,
  ISiteRepository | IMailerService
> =>
  Effect.gen(function* () {
    const repo = yield* ISiteRepository;
    const mailer = yield* IMailerService;

    if (!props.siteId || !props.content) {
      yield* Effect.fail(new ValidationError({ message: "Komentar tidak boleh kosong" }));
    }

    yield* repo.saveComment(props.siteId, userId, props.content);

    const siteInfo = yield* repo.getMakerInfoBySiteId(props.siteId);
    
    if (siteInfo?.maker_email) {
      const emailEff = mailer.sendEmail({
        to: siteInfo.maker_email,
        subject: `Komentar baru pada produk Anda: ${siteInfo.title} 💬`,
        html: `
          <h3>Halo, ${siteInfo.maker_name || siteInfo.maker_username}!</h3>
          <p>Seseorang telah menulis komentar baru pada produk Anda <strong>${siteInfo.title}</strong>:</p>
          <blockquote style="border-left: 4px solid #3b82f6; padding-left: 1rem; color: #4b5563; font-style: italic; margin: 1.5rem 0;">
            "${props.content}"
          </blockquote>
          <p><a href="${APP_CONFIG.BASE_URL}/sites/site/${props.siteId}#comments" style="display: inline-block; padding: 0.5rem 1rem; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 0.375rem; font-weight: 500;">Lihat komentar di Kukode</a></p>
        `
      });
      yield* Effect.forkDaemon(Effect.either(emailEff));
    }
  });
