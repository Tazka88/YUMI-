import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

const PIXEL_ID = process.env.FB_PIXEL_ID || '2110613746362191';
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || 'EAASOnBbYKrMBRNu5n9efjeiSC34KVBiJyYV7OMAXgZBGJh34IJFkXG2oAWZAoaVOTVRdD7jEDFZAFZCZApzej0kXl6NZCwUhvBPNOOkZAxldsdtLN22C7SjhWa6xQzMjfLQQDiogwITTo1nFj3KV9k0X8SZBZAJwAU0KMu8R5exGJwCRH39z1lZBWx8CNg79Pg3seNnQZDZD';

function hashData(data: string | undefined | null): string | undefined {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

router.post('/event', async (req, res) => {
  try {
    const { eventName, eventId, eventSourceUrl, userData, customData } = req.body;

    // Get IP and User Agent from request headers
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const hashedUserData: any = {
      client_ip_address: typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : clientIp,
      client_user_agent: userAgent,
      fbc: userData?.fbc,
      fbp: userData?.fbp,
    };

    if (userData?.email) hashedUserData.em = hashData(userData.email);
    if (userData?.phone) hashedUserData.ph = hashData(userData.phone);
    if (userData?.firstName) hashedUserData.fn = hashData(userData.firstName);
    if (userData?.lastName) hashedUserData.ln = hashData(userData.lastName);

    const event = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_id: eventId,
      event_source_url: eventSourceUrl,
      user_data: hashedUserData,
      custom_data: {
        currency: 'DZD',
        ...customData,
        ...(customData?.value ? { value: Number(customData.value) } : {})
      }
    };

    const payload: any = {
      data: [event],
    };

    // Test mode
    const TEST_EVENT_CODE = process.env.FB_TEST_EVENT_CODE;
    if (TEST_EVENT_CODE) {
      payload.test_event_code = TEST_EVENT_CODE;
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Facebook CAPI Error:', result);
      return res.status(400).json({ error: result });
    }

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('CAPI Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
