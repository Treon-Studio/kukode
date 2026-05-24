export interface TPotdResult {
  readonly success: boolean;
  readonly date?: string;
  readonly site_id?: string;
  readonly site_title?: string;
  readonly vote_count?: number;
  readonly message?: string;
}

export interface TSiteInfo {
  readonly title: string;
  readonly maker_id: string;
  readonly maker_email: string | null;
  readonly maker_name: string | null;
  readonly maker_username: string | null;
}
