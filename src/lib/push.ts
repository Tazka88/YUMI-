import webpush from 'web-push';
import { sql } from '../db/setup.js';

// VAPID Credentials (uses env vars if present, with verified defaults)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BBoCAstBGa3S9HpV74Injr2AqR3oOOCq0dQcBtehU4fqUsVl9uqLrhRnLXbdQvOBwht4ibyAELUxNgKpBJnIUDo';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UE0gs2Yxu6CinpngnbbQV4QWm60ekBosP_9iVAksibo';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@zorando.com';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.error('[WebPush] Initialization error:', err);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  image?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Get subscriber statistics and recent campaigns
 */
export async function getPushDashboardData() {
  try {
    const [subCountResult] = await sql`SELECT count(*)::int as count FROM push_subscriptions`;
    const totalSubscribers = subCountResult?.count || 0;

    const recentSubscribers = await sql`
      SELECT id, endpoint, user_agent, created_at
      FROM push_subscriptions
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const recentCampaigns = await sql`
      SELECT *
      FROM push_campaigns
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return {
      totalSubscribers,
      recentSubscribers,
      recentCampaigns,
      vapidPublicKey: VAPID_PUBLIC_KEY
    };
  } catch (error) {
    console.error('[WebPush] Error fetching dashboard data:', error);
    throw error;
  }
}

/**
 * Send a web push campaign to subscribers
 */
export async function broadcastPushCampaign(payload: PushPayload, target: 'all' | 'latest_test' = 'all') {
  try {
    // 1. Fetch target subscriptions
    let subscriptions: any[] = [];
    if (target === 'latest_test') {
      subscriptions = await sql`
        SELECT id, endpoint, p256dh, auth, user_agent
        FROM push_subscriptions
        ORDER BY created_at DESC
        LIMIT 1
      `;
    } else {
      subscriptions = await sql`
        SELECT id, endpoint, p256dh, auth, user_agent
        FROM push_subscriptions
      `;
    }

    if (subscriptions.length === 0) {
      return {
        success: false,
        message: "Aucun abonné enregistré dans la base de données. Activez les notifications sur un appareil d'abord.",
        total: 0,
        sent: 0,
        failed: 0
      };
    }

    // 2. Format the push payload
    const notificationPayload = JSON.stringify({
      title: payload.title || 'Zorando',
      body: payload.body,
      icon: payload.icon || '/icon-maskable-512.png',
      badge: payload.badge || '/badge-72x72.png',
      image: payload.image || undefined,
      url: payload.url || '/',
      tag: payload.tag || 'zorando-promo-' + Date.now(),
      data: {
        url: payload.url || '/',
        timestamp: Date.now()
      }
    });

    let sent = 0;
    let failed = 0;
    const deadSubscriptionIds: string[] = [];

    // 3. Send notifications concurrently
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload, {
            TTL: 60 * 60 * 24 // 24 hours
          });
          return { success: true, id: sub.id };
        } catch (err: any) {
          // If subscription has expired or unsubscribed, flag for deletion
          if (err.statusCode === 410 || err.statusCode === 404) {
            deadSubscriptionIds.push(sub.id);
          }
          throw err;
        }
      })
    );

    results.forEach((res) => {
      if (res.status === 'fulfilled') sent++;
      else failed++;
    });

    // 4. Clean up dead subscriptions asynchronously if any
    if (deadSubscriptionIds.length > 0) {
      try {
        await sql`
          DELETE FROM push_subscriptions
          WHERE id = ANY(${deadSubscriptionIds})
        `;
        console.log(`[WebPush] Removed ${deadSubscriptionIds.length} expired subscriptions`);
      } catch (cleanErr) {
        console.error('[WebPush] Error cleaning dead subscriptions:', cleanErr);
      }
    }

    // 5. Record campaign in push_campaigns table
    const [savedCampaign] = await sql`
      INSERT INTO push_campaigns (
        title, body, image, url, target_audience,
        recipients_count, success_count, failure_count, status
      ) VALUES (
        ${payload.title},
        ${payload.body},
        ${payload.image || null},
        ${payload.url || '/'},
        ${target},
        ${subscriptions.length},
        ${sent},
        ${failed},
        ${sent > 0 ? 'sent' : 'failed'}
      )
      RETURNING *
    `;

    return {
      success: true,
      campaign: savedCampaign,
      total: subscriptions.length,
      sent,
      failed
    };
  } catch (error: any) {
    console.error('[WebPush] Broadcast error:', error);
    throw error;
  }
}
