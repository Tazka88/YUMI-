import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

const PIXEL_ID = process.env.FB_PIXEL_ID || '2110613746362191';
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || 'EAASOnBbYKrMBRNu5n9efjeiSC34KVBiJyYV7OMAXgZBGJh34IJFkXG2oAWZAoaVOTVRdD7jEDFZAFZCZApzej0kXl6NZCwUhvBPNOOkZAxldsdtLN22C7SjhWa6xQzMjfLQQDiogwITTo1nFj3KV9k0X8SZBZAJwAU0KMu8R5exGJwCRH39z1lZBWx8CNg79Pg3seNnQZDZD';

function hashData(data: string | undefined | null): string | undefined {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

router.post('/', async (req, res) => {
  try {
    const { eventName, eventId, eventSourceUrl, userData, customData } = req.body;

    const ALLOWED_EVENTS = ['Purchase', 'InitiateCheckout', 'AddToCart', 'ViewContent', 'PageView'];
    if (!ALLOWED_EVENTS.includes(eventName)) {
      return res.status(200).json({ success: true, skipped: true });
    }

    let finalEventId = eventId ? String(eventId) : undefined;
    if (eventName === 'Purchase' && !finalEventId) {
      console.warn('⚠️ CAPI: Purchase event received WITHOUT eventId. Generating fallback ID to satisfy Meta format.');
      finalEventId = 'fallback_pur_' + Date.now();
    }

    // Get IP and User Agent from request headers
    const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    let validFbc = userData?.fbc;
    let validFbp = userData?.fbp;

    // Validate fbc format: fb.subdomainIndex.creationTime.fbclid(.appendix)
    if (validFbc && (typeof validFbc !== 'string' || !validFbc.startsWith('fb.'))) {
      validFbc = undefined;
    }
    
    // Validate fbp format: fb.subdomainIndex.creationTime.random(.appendix)
    if (validFbp && (typeof validFbp !== 'string' || !validFbp.startsWith('fb.'))) {
      validFbp = undefined;
    }

    const hashedUserData: any = {
      client_ip_address: typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : clientIp,
      client_user_agent: userAgent,
      fbc: validFbc,
      fbp: validFbp,
    };

    if (userData?.email) hashedUserData.em = hashData(userData.email);
    if (userData?.phone) hashedUserData.ph = hashData(userData.phone);
    if (userData?.firstName) hashedUserData.fn = hashData(userData.firstName);
    if (userData?.lastName) hashedUserData.ln = hashData(userData.lastName);
    if (userData?.external_id) hashedUserData.external_id = hashData(userData.external_id);

    const event = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_id: finalEventId,
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

    // Test mode disabled for production
    // const TEST_EVENT_CODE = process.env.FB_TEST_EVENT_CODE;
    // if (TEST_EVENT_CODE) {
    //   payload.test_event_code = TEST_EVENT_CODE;
    // }

    if (eventName === 'Purchase') {
      console.log(`\n======================================`);
      console.log(`🚀 [CAPI] Ougoing Purchase Event to Meta`);
      console.log(`- Event ID: ${finalEventId}`);
      console.log(`- Value: ${customData?.value} DZD`);
      console.log(`======================================\n`);
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.error('Fetch to Facebook Graph API failed:', err);
      throw new Error(`Fetch failed: ${err.message}`);
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Facebook CAPI Error:', result);
      return res.status(400).json({ error: result });
    }

    if (eventName === 'Purchase') {
      console.log(`✅ [CAPI] Purchase Event Successfully Received by Meta!`);
      console.log(`Meta Response:`, result);
    }

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('CAPI Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
