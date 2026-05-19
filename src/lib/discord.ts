/**
 * Utility to send rich notifications to Discord via Webhooks.
 */
import { NOTIFICATION_CONFIG } from '@/lib/constants';

interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  thumbnail?: { url: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
}

/**
 * Sends a raw payload to Discord Webhook.
 */
export async function sendDiscordNotification(payload: {
  content?: string;
  embeds?: DiscordEmbed[];
}) {
  const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('Discord webhook skipped: DISCORD_WEBHOOK_URL env not set.');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'Kukode Bot',
        avatar_url: NOTIFICATION_CONFIG.DISCORD_BOT_AVATAR, // Fallback bot avatar
        ...payload,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Discord webhook failed with status ${response.status}:`, errorText);
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

/**
 * Sends a notification for user sign up / registration.
 */
export async function notifyUserRegistration(user: {
  username: string;
  email: string;
  fullName?: string | null;
}) {
  await sendDiscordNotification({
    embeds: [
      {
        title: '👤 Registrasi Pengguna Baru!',
        description: `Pengguna baru telah mendaftar ke platform Kukode.`,
        color: NOTIFICATION_CONFIG.COLORS.INFO, // Accent blue color
        fields: [
          { name: 'Username', value: `@${user.username}`, inline: true },
          { name: 'Nama Lengkap', value: user.fullName || '-', inline: true },
          { name: 'Email', value: user.email, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Kukode Auth System',
        },
      },
    ],
  });
}

/**
 * Sends a notification for project submission.
 */
export async function notifyProjectSubmission(project: {
  title: string;
  tagline: string;
  liveUrl: string;
  thumbnailUrl?: string | null;
  tags?: string[];
  makerUsername: string;
}) {
  const embeds: DiscordEmbed[] = [
    {
      title: `🚀 Produk Baru Disubmit: ${project.title}`,
      description: project.tagline,
      url: project.liveUrl,
      color: NOTIFICATION_CONFIG.COLORS.SUCCESS, // Emerald green color
      fields: [
        { name: 'Live URL', value: `[Buka Situs](${project.liveUrl})`, inline: true },
        { name: 'Maker', value: `@${project.makerUsername}`, inline: true },
        {
          name: 'Tags',
          value: project.tags && project.tags.length > 0 ? project.tags.join(', ') : '-',
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Kukode Submissions',
      },
    },
  ];

  if (project.thumbnailUrl) {
    embeds[0].thumbnail = { url: project.thumbnailUrl };
  }

  await sendDiscordNotification({ embeds });
}
