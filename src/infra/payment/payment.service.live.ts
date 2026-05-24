import { Layer, Effect } from "effect";
import { IPaymentService } from "./payment.service";
import { HttpError } from "@/shared/errors/infrastructure.errors";

export const PaymentServiceLive = Layer.succeed(
  IPaymentService,
  {
    createInvoice: (params, secretKey) => Effect.tryPromise({
      try: async () => {
        if (!secretKey) {
          throw new Error('Xendit Secret API Key is not configured');
        }

        const authHeader = `Basic ${btoa(`${secretKey}:`)}`;

        const response = await fetch('https://api.xendit.co/v2/invoices', {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            external_id: params.externalId,
            amount: params.amount,
            payer_email: params.payerEmail,
            description: params.description,
            success_redirect_url: params.successRedirectUrl,
            failure_redirect_url: params.failureRedirectUrl,
            currency: params.currency || 'USD',
          }),
        });

        const data: any = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error_code || 'Xendit invoice creation failed');
        }

        return data;
      },
      catch: (e) => new HttpError({ cause: e, message: "Failed to create Xendit invoice" })
    })
  }
);
