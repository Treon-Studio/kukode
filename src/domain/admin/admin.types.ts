export interface TMakerProfile {
  readonly email: string;
  readonly full_name: string | null;
  readonly username: string;
}

export interface TApprovedSite {
  readonly title: string;
  readonly live_url: string | null;
  readonly maker_id: string;
  readonly maker: TMakerProfile | null;
}

export interface TRejectedSite {
  readonly title: string;
  readonly maker_id: string;
  readonly maker: TMakerProfile | null;
}

export interface TApproveSiteProps {
  readonly site_id: string;
}

export interface TRejectSiteProps {
  readonly site_id: string;
  readonly reason: string;
}

export interface TManageFlagProps {
  readonly action: string;
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly is_enabled?: boolean;
  readonly env_override?: boolean;
  readonly whitelist?: string;
  readonly rollout_percentage?: number;
}

export interface TManageReportProps {
  readonly report_id: string;
  readonly action: string;
}
