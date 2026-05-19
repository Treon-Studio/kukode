/**
 * Email Helper using Resend
 *
 * In development (or if API key is missing), this will just log to the console.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
  // Default sender from env, fallback to onboarding@resend.dev for testing if on free tier
  const RESEND_FROM = import.meta.env.RESEND_FROM || 'Kukode <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    console.log('\n--- EMAIL MOCK ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('HTML:\n' + html);
    console.log('------------------\n');
    return { success: true, mocked: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Resend Error:', errorData);
      return { success: false, error: errorData };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    console.error('Email sending failed:', err);
    return { success: false, error: err.message };
  }
}
