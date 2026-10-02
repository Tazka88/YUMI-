// ============================================
// ZORANDO - Client Push Notifications (v8.2)
// VAPID Key: Active & Verified
// ============================================

const VAPID_PUBLIC_KEY = 'BBoCAstBGa3S9HpV74Injr2AqR3oOOCq0dQcBtehU4fqUsVl9uqLrhRnLXbdQvOBwht4ibyAELUxNgKpBJnIUDo';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT ' + label)), ms))
  ]);
}

async function getActiveSW() {
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }
  if (reg.active) return reg;
  await withTimeout(
    new Promise((resolve) => {
      const sw = reg.installing || reg.waiting;
      if (!sw) return resolve();
      sw.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') resolve();
      });
    }),
    5000,
    'sw-activation'
  );
  return reg;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator)) throw new Error('SW non supporte');

  const registration = await withTimeout(getActiveSW(), 8000, 'get-active-sw');

  const permission = await withTimeout(
    Notification.requestPermission(),
    10000,
    'permission'
  );
  if (permission !== 'granted') throw new Error('Permission: ' + permission);

  const subscription = await withTimeout(
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    }),
    15000,
    'subscribe'
  );

  const subData = subscription.toJSON();
  const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content || '';
  const supabaseKey = document.querySelector('meta[name="supabase-key"]')?.content || '';
  if (!supabaseUrl || !supabaseKey) throw new Error('Config Supabase manquante');

  const response = await withTimeout(
    fetch(supabaseUrl + '/rest/v1/push_subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        endpoint: subData.endpoint,
        p256dh: subData.keys.p256dh,
        auth: subData.keys.auth,
        user_agent: navigator.userAgent
      })
    }),
    10000,
    'fetch'
  );

  if (response.status === 409) return true;
  if (!response.ok && response.status !== 201) {
    throw new Error('HTTP ' + response.status + ': ' + await response.text());
  }
  return true;
}

function showNotificationBanner() {
  if (localStorage.getItem('zorando_push_subscribed') === 'true') return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') return;
  if (Notification.permission === 'denied') return;

  setTimeout(() => {
    const banner = document.createElement('div');
    banner.id = 'zorando-push-banner';
    banner.innerHTML = '<div style="position:fixed;bottom:20px;left:20px;right:20px;max-width:400px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.15);padding:20px;z-index:99999;font-family:system-ui,sans-serif;border:2px solid #FF6B00;"><div style="display:flex;gap:12px;"><div style="font-size:32px;">🔔</div><div style="flex:1;"><div style="font-weight:700;font-size:16px;color:#111;margin-bottom:6px;">Recevez nos promos !</div><div style="font-size:14px;color:#666;margin-bottom:14px;">Soyez informe des ventes flash et offres exclusives Zorando.</div><div style="display:flex;gap:8px;"><button id="zorando-push-accept" style="flex:1;background:#FF6B00;color:#fff;border:none;padding:10px;border-radius:10px;font-weight:600;cursor:pointer;">Activer</button><button id="zorando-push-dismiss" style="background:#f0f0f0;color:#666;border:none;padding:10px 16px;border-radius:10px;font-weight:600;cursor:pointer;">Plus tard</button></div><div id="zorando-error" style="display:none;margin-top:10px;padding:8px;background:#ffebee;border-radius:6px;font-size:11px;color:#c62828;"></div></div></div></div>';
    document.body.appendChild(banner);

    document.getElementById('zorando-push-accept').onclick = async () => {
      const btn = document.getElementById('zorando-push-accept');
      const errDiv = document.getElementById('zorando-error');
      btn.textContent = 'Chargement...';
      btn.disabled = true;
      errDiv.style.display = 'none';
      try {
        await subscribeToPush();
        localStorage.setItem('zorando_push_subscribed', 'true');
        banner.remove();
      } catch (error) {
        btn.textContent = 'Erreur - Reessayer';
        btn.disabled = false;
        errDiv.textContent = error.message;
        errDiv.style.display = 'block';
      }
    };

    document.getElementById('zorando-push-dismiss').onclick = () => {
      banner.remove();
    };
  }, 3000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showNotificationBanner);
} else {
  showNotificationBanner();
}
