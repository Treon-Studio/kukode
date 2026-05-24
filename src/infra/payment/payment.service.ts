import { Context, Effect } from "effect";
import type { HttpError } from "@/shared/errors/infrastructure.errors";

export interface XenditInvoiceResponse {
  readonly id: string;
  readonly invoice_url: string;
  readonly status: string;
  readonly external_id: string;
  readonly amount: number;
  readonly payer_email?: string;
  readonly description?: string;
}

export interface CreateInvoiceParams {
  readonly externalId: string;
  readonly amount: number;
  readonly payerEmail: string;
  readonly description: string;
  readonly successRedirectUrl: string;
  readonly failureRedirectUrl: string;
  readonly currency?: string;
}

export class IPaymentService extends Context.Tag("IPaymentService")<
  IPaymentService,
  {
    readonly createInvoice: (
      params: CreateInvoiceParams, 
      secretKey: string
    ) => Effect.Effect<XenditInvoiceResponse, HttpError>;
  }
>() {}
