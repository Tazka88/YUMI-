// Utility to send Facebook Conversions API events

// Helper to get cookie by name
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

// Helper to get or create fbc (click id)
function getFbc(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  // 1. Try to get from cookie first
  const fbcCookie = getCookie('_fbc');
  if (fbcCookie) return fbcCookie;

  // 2. Try to get from URL (fbclid)
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  
  if (fbclid) {
    // Format: version.subdomainIndex.creationTime.fbclid
    const creationTime = Date.now();
    const newFbc = `fb.1.${creationTime}.${fbclid}`;
    
    // Save it to cookie for future events
    document.cookie = `_fbc=${newFbc}; path=/; max-age=7776000; SameSite=Lax`; // 90 days
    return newFbc;
  }

  return undefined;
}

// Helper to get or create external_id
function getExternalId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  let extId = getCookie('_yumi_ext_id');
  if (!extId) {
    extId = 'usr_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    // Save it to cookie for 6 months
    document.cookie = `_yumi_ext_id=${extId}; path=/; max-age=15552000; SameSite=Lax`;
  }
  return extId;
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
  if (typeof window !== 'undefined' && !window.location.hostname.includes('yumidz.vercel.app')) {
    console.log(`[CAPI] Skipped ${eventName} event (non-production environment)`);
    return;
  }

  // Delay slightly to allow FB Pixel to set the _fbp cookie on first load
  setTimeout(async () => {
    try {
      const fbc = getFbc();
      const fbp = getCookie('_fbp');

      const payload = {
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        userData: {
          ...userData,
          fbc,
          fbp,
          external_id: getExternalId()
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
  }, 500); // 500ms delay
}
