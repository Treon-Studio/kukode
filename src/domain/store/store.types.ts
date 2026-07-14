export interface TCreateStoreInvoiceProps {
  readonly slug: string;
}

export interface TCreateAdInvoiceProps {
  readonly pkg: string;
  readonly siteId?: string;
}

export interface TCreateSubscribeProps {
  readonly plan: string;
}
