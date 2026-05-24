import { Effect } from "effect";
import { ICommentsRepository } from "./comments.repository";
import { UnauthorizedError, ValidationError, NotFoundError } from "./comments.errors";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TReportCommentProps } from "./comments.types";

export const reportCommentProgram = (
  props: TReportCommentProps,
  user: any
): Effect.Effect<
  { success: boolean; message: string },
  UnauthorizedError | ValidationError | NotFoundError | DatabaseError,
  ICommentsRepository
> =>
  Effect.gen(function* () {
    if (!user) {
      yield* Effect.fail(new UnauthorizedError({ message: "Anda harus login untuk melaporkan komentar" }));
    }

    if (!props.comment_id || !props.reason?.trim()) {
      yield* Effect.fail(new ValidationError({ message: "ID komentar dan alasan pelaporan wajib diisi" }));
    }

    const repo = yield* ICommentsRepository;

    const existingComment = yield* repo.fetchComment(props.comment_id);
    if (!existingComment) {
      yield* Effect.fail(new NotFoundError({ message: "Komentar tidak ditemukan" }));
    }

    if (existingComment.user_id === user.id) {
      yield* Effect.fail(new ValidationError({ message: "Anda tidak dapat melaporkan komentar Anda sendiri" }));
    }

    yield* repo.reportComment(props.comment_id, user.id, props.reason);

    return { success: true, message: "Komentar berhasil dilaporkan" };
  });
