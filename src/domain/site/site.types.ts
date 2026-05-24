export interface TSubmitSiteProps {
  readonly title: string;
  readonly tagline: string;
  readonly liveUrl: string;
  readonly description: string;
  readonly tagsRaw?: string;
  readonly thumbnailUrl?: string;
  readonly thumbnailFile?: File | null;
}

export interface TVoteSiteProps {
  readonly siteId: string;
}

export interface TCommentSiteProps {
  readonly siteId: string;
  readonly content: string;
}
