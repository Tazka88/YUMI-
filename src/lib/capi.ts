// Utility to send Facebook Conversions API events

// Helper to get cookie by name
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

// Generate a random event ID for deduplication
export function generateEventId(): string {
  return 'evt_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

interface CapiEventData {
  eventName: string;
  eventId: string;
  customData?: any;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
}

export async function sendCapiEvent({ eventName, eventId, customData, userData }: CapiEventData) {
  // Only send CAPI events from the production domain
  if (typeof window !== 'undefined' && window.location.hostname !== 'yumidz.vercel.app') {
    console.log(`[CAPI] Skipped ${eventName} event (non-production environment)`);
    return;
  }

  try {
    const fbc = getCookie('_fbc');
    const fbp = getCookie('_fbp');

    const payload = {
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      userData: {
        ...userData,
        fbc,
        fbp
      },
      customData
    };

    const response = await fetch('/api/capi/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Failed to send CAPI event', await response.text());
    }
  } catch (error) {
    console.error('Error sending CAPI event:', error);
  }
}
