export interface TReportCommentProps {
  readonly comment_id: string;
  readonly reason: string;
}

export interface TComment {
  readonly id: string;
  readonly user_id: string;
  readonly site_id: string;
  readonly content: string;
  readonly created_at: Date;
}
