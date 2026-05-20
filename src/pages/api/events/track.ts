import type { APIRoute } from 'astro';
import { recordEvent } from '@/lib/analytics';
import { checkRateLimit } from '@/lib/ratelimit';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Identify Client IP for Rate Limiting & Identification
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  // 2. Apply Rate Limiting
  const env = locals.runtime?.env;
  const rateLimitResult = await checkRateLimit('action', `track_${ip}`, env);
  if (rateLimitResult && !rateLimitResult.success) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { site_id, event_type, referrer } = await request.json();

    if (!event_type || (event_type !== 'view' && event_type !== 'click')) {
      return new Response(JSON.stringify({ error: 'Invalid event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = (locals as any).user;
    const country = request.headers.get('cf-ipcountry') || 'Unknown';
    const city = request.headers.get('cf-ipcity') || 'Unknown';

    // 3. Record event asynchronously
    await recordEvent({
      siteId: site_id,
      eventType: event_type,
      referrer,
      ip,
      userId: user?.id,
      country,
      city,
      env,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
