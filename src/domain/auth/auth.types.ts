export interface TSignupProps {
  readonly email: string;
  readonly username: string;
  readonly password?: string;
  readonly fullName?: string;
  readonly preferredLang?: string;
}

export interface TSigninProps {
  readonly email: string;
  readonly password?: string;
}
