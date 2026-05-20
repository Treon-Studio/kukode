export interface XenditInvoiceResponse {
  id: string;
  invoice_url: string;
  status: string;
  external_id: string;
  amount: number;
  payer_email?: string;
  description?: string;
}

/**
 * Creates a payment invoice using Xendit API.
 * Uses vanilla fetch for Edge runtime compatibility.
 */
export async function createXenditInvoice(params: {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  secretKey: string;
  currency?: string;
}): Promise<XenditInvoiceResponse> {
  if (!params.secretKey) {
    throw new Error('Xendit Secret API Key is not configured');
  }

  // Base64 encode the secret key for HTTP Basic Auth (password is blank)
  const authHeader = `Basic ${btoa(`${params.secretKey}:`)}`;

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

  return data as XenditInvoiceResponse;
}
