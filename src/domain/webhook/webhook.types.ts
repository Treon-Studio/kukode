export interface TXenditCallbackPayload {
  readonly id: string;
  readonly external_id: string;
  readonly status: string;
}

export interface TUserProfile {
  readonly email: string | null;
  readonly full_name: string | null;
  readonly username: string | null;
}
