import { Resend } from 'resend';
import { sql } from '../db/setup.js';

const logEmail = async (order_id: string | null, recipient: string, subject: string, status: 'success' | 'error', error_message?: string) => {
  try {
    await sql`
      INSERT INTO email_logs (order_id, recipient, subject, status, error_message)
      VALUES (${order_id}, ${recipient}, ${subject}, ${status}, ${error_message || null})
    `;
  } catch (err) {
    console.error('Failed to log email to database:', err);
  }
};

let cachedApiKey: string | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute
let apiKeyPromise: Promise<string | null> | null = null;

const getApiKey = async () => {
  const now = Date.now();
  if (cachedApiKey && (now - lastCacheTime < CACHE_TTL)) {
    return cachedApiKey;
  }

  if (apiKeyPromise) {
    return apiKeyPromise;
  }

  apiKeyPromise = (async () => {
    // Check settings first, as user-provided settings should take priority
    try {
      const [row] = await sql`SELECT value FROM settings WHERE key = 'resend_api_key'`;
      if (row?.value && row.value.trim() !== '' && !row.value.includes('your_resend_api_key')) {
        cachedApiKey = row.value.trim();
        lastCacheTime = Date.now();
        return cachedApiKey;
      }
    } catch (err) {
      console.warn('Warning: Could not fetch resend_api_key from settings table:', err);
    }

    // Fallback to env
    const envKey = process.env.RESEND_API_KEY;
    if (envKey && 
        envKey.trim() !== '' && 
        envKey !== 're_your_resend_api_key' &&
        !envKey.includes('your_resend_api_key')) {
      cachedApiKey = envKey.trim();
      lastCacheTime = Date.now();
      return cachedApiKey;
    }
    
    if (cachedApiKey) return cachedApiKey; // Return stale cache if all else fails
    
    return null;
  })().finally(() => {
    apiKeyPromise = null;
  });

  return apiKeyPromise;
};

let cachedFromEmail: string | null = null;
let lastFromCacheTime = 0;
let fromEmailPromise: Promise<string | null> | null = null;

const getFromEmail = async () => {
  const now = Date.now();
  if (cachedFromEmail && (now - lastFromCacheTime < CACHE_TTL)) {
    return cachedFromEmail;
  }

  if (fromEmailPromise) {
    return fromEmailPromise;
  }

  fromEmailPromise = (async () => {
    try {
      const [row] = await sql`SELECT value FROM settings WHERE key = 'resend_from_email'`;
      if (row?.value && row.value.trim() !== '') {
        cachedFromEmail = row.value.trim();
        lastFromCacheTime = Date.now();
        return cachedFromEmail;
      }
    } catch (err) {
      // Ignore db error
    }

    if (process.env.RESEND_FROM_EMAIL) {
      cachedFromEmail = process.env.RESEND_FROM_EMAIL.trim();
      lastFromCacheTime = Date.now();
      return cachedFromEmail;
    }

    if (cachedFromEmail && cachedFromEmail !== 'ZORANDO <onboarding@resend.dev>') {
        return cachedFromEmail; // Return stale cache if all else fails
    }

    const defaultEmail = 'ZORANDO <onboarding@resend.dev>';
    cachedFromEmail = defaultEmail;
    lastFromCacheTime = Date.now();
    return defaultEmail;
  })().finally(() => {
    fromEmailPromise = null;
  });

  return fromEmailPromise;
};

export const sendOrderConfirmationEmail = async (orderId: string, customerName: string, customerEmail: string, totalAmount: number) => {
  const subject = `Confirmation de votre commande ${orderId} - ZORANDO`;
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    console.error('RESEND_API_KEY is missing. Email skipped.');
    await logEmail(orderId, customerEmail, subject, 'error', 'RESEND_API_KEY is missing (env & db)');
    return;
  }

  if (!customerEmail) {
    console.error('Customer email is missing for order:', orderId);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const fromEmail = await getFromEmail();
    
    // Check if using onboarding email and trying to send to someone else
    const isUsingOnboarding = fromEmail.includes('onboarding@resend.dev');
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #f97316;">ZORANDO</h1>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; rounded: 8px; border: 1px solid #e5e7eb;">
            <h2 style="margin-top: 0;">Merci pour votre commande, ${customerName} !</h2>
            <p>Nous avons bien reçu votre commande <strong>#${orderId}</strong>.</p>
            <p>Nous préparons actuellement vos articles avec le plus grand soin. Notre service client vous contactera par téléphone pour confirmer les détails de la livraison.</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #fff; border-radius: 4px; border-left: 4px solid #f97316;">
              <p style="margin: 0; font-size: 18px;">Total de la commande : <strong>${totalAmount} DA</strong></p>
            </div>

            <p style="font-size: 14px; color: #666;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          </div>
          <div style="text-align: center; padding-top: 20px; font-size: 12px; color: #999;">
            <p>© ${new Date().getFullYear()} ZORANDO Algérie. Tous droits réservés.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      let errorMsg = JSON.stringify(error);
      if (errorMsg.includes('422') || errorMsg.includes('validation_error')) {
        if (fromEmail.includes('onboarding@resend.dev')) {
          errorMsg = "Erreur 422 : L'email 'onboarding@resend.dev' ne peut envoyer qu'à votre adresse Resend. Changez-le dans Paramètres > Compte pour envoyer aux clients.";
        } else {
          errorMsg = `Erreur 422 : L'email d'expédition '${fromEmail}' n'est pas autorisé par Resend. Vérifiez que votre domaine est validé.`;
        }
      }
      await logEmail(orderId, customerEmail, subject, 'error', errorMsg);
    } else {
      console.log(`Confirmation email sent via Resend: ${data?.id}`);
      await logEmail(orderId, customerEmail, subject, 'success');
    }
  } catch (error: any) {
    console.error('Failed to send order confirmation email:', error);
    await logEmail(orderId, customerEmail, subject, 'error', error.message);
  }
};

export const sendAdminNotificationEmail = async (adminEmail: string, orderId: string, customerName: string, customerEmail: string, customerPhone: string, totalAmount: number, items: any[]) => {
  const subject = `NOUVELLE COMMANDE - ${orderId} - ZORANDO`;
  const apiKey = await getApiKey();
  
  if (!apiKey || !adminEmail) {
    console.error('Missing API Key or Admin Email for notification');
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const fromEmail = await getFromEmail();
    
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || 'Produit'} ${item.variation ? `(${item.variation})` : ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price} DA</td>
      </tr>
    `).join('');

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Une nouvelle commande a été passée !</h2>
          <p><strong>Commande:</strong> #${orderId}</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          
          <h3>Détails du Client :</h3>
          <p><strong>Nom:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail || 'Non fourni'}</p>
          <p><strong>Téléphone:</strong> ${customerPhone}</p>
          
          <h3>Articles :</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f9fafb;">
              <tr>
                <th style="padding: 10px; text-align: left;">Produit</th>
                <th style="padding: 10px; text-align: center;">Qté</th>
                <th style="padding: 10px; text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <p style="font-size: 18px; margin-top: 20px;"><strong>Total : ${totalAmount} DA</strong></p>
          
          <div style="margin-top: 30px; padding: 15px; background: #fffbeb; border: 1px solid #fef3c7; color: #92400e;">
            Connectez-vous au tableau de bord pour gérer cette commande.
          </div>
        </div>
      `
    });
    
    if (error) {
      console.error('Resend API error (admin notification):', error);
      let errorMsg = JSON.stringify(error);
      if (errorMsg.includes('422') || errorMsg.includes('validation_error')) {
        if (fromEmail.includes('onboarding@resend.dev')) {
          errorMsg = "Erreur 422 : Notifications impossibles via 'onboarding@resend.dev' vers cet email. Changez l'Email d'expédition dans Paramètres > Compte.";
        } else {
          errorMsg = `Erreur 422 : L'email d'expédition '${fromEmail}' n'est pas autorisé par Resend. Vérifiez que votre domaine est validé.`;
        }
      }
      await logEmail(orderId, adminEmail, subject, 'error', errorMsg);
    } else {
      console.log(`Admin notification sent for order ${orderId}`);
      await logEmail(orderId, adminEmail, subject, 'success');
    }
  } catch (error: any) {
    console.error('Failed to send admin notification:', error);
    await logEmail(orderId, adminEmail, subject, 'error', error.message);
  }
};

export const sendContactEmail = async (adminEmail: string, name: string, email: string, message: string) => {
  const subject = `NOUVEAU MESSAGE DE CONTACT - ${name} - ZORANDO`;
  const apiKey = await getApiKey();
  
  if (!apiKey || !adminEmail) {
    console.error('Missing API Key or Admin Email for contact message');
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const fromEmail = await getFromEmail();
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: subject,
      replyTo: email,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Nouveau message de contact</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          
          <p><strong>De:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          
          <div style="margin-top: 20px; padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <p style="margin-top: 0; font-weight: bold; color: #666;">Message :</p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            Vous pouvez répondre directement à cet email pour contacter l'expéditeur.
          </p>
        </div>
      `
    });
    
    if (error) {
      console.error('Resend API error (contact):', error);
      let errorMsg = JSON.stringify(error);
      if (errorMsg.includes('422') || errorMsg.includes('validation_error')) {
        if (fromEmail.includes('onboarding@resend.dev')) {
          errorMsg = "Erreur 422 : Impossible de recevoir via 'onboarding@resend.dev'. Utilisez un email d'expédition de votre propre domaine verified.";
        } else {
          errorMsg = `Erreur 422 : L'email d'expédition '${fromEmail}' n'est pas autorisé.`;
        }
      }
      await logEmail(null, adminEmail, subject, 'error', errorMsg);
    } else {
      console.log(`Contact email sent from ${name}`);
      await logEmail(null, adminEmail, subject, 'success');
    }
  } catch (error: any) {
    console.error('Failed to send contact email:', error);
    await logEmail(null, adminEmail, subject, 'error', error.message);
  }
};

export const sendOrderStatusEmail = async (orderId: string, customerName: string, customerEmail: string, status: string) => {
  const subject = `Mise à jour de votre commande ${orderId} - ZORANDO`;
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    console.error('RESEND_API_KEY is missing. Status email skipped.');
    return;
  }

  if (!customerEmail) return;

  let statusText = '';
  let statusMessage = '';

  switch (status) {
    case 'processing':
      statusText = 'en préparation';
      statusMessage = 'Votre commande est en cours de préparation. Nous vérifions la qualité de vos articles avant l\'expédition.';
      break;
    case 'shipped':
      statusText = 'expédiée';
      statusMessage = 'Bonne nouvelle ! Votre commande a été remise au transporteur et est en route vers chez vous.';
      break;
    case 'delivered':
      statusText = 'livrée';
      statusMessage = 'Votre commande a été marquée comme livrée. Nous espérons que vos achats vous plaisent !';
      break;
    case 'cancelled':
      statusText = 'annulée';
      statusMessage = 'Votre commande a été annulée. Si vous n\'êtes pas à l\'origine de cette annulation, veuillez contacter notre support.';
      break;
    default:
      return; 
  }

  try {
    const resend = new Resend(apiKey);
    const fromEmail = await getFromEmail();

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #f97316;">ZORANDO</h1>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; rounded: 8px; border: 1px solid #e5e7eb;">
            <h2>Mise à jour de votre commande</h2>
            <p>Bonjour ${customerName},</p>
            <p>Le statut de votre commande <strong>#${orderId}</strong> a changé.</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #fff; border-radius: 4px; border-left: 4px solid #f97316; text-align: center;">
              <p style="margin: 0; font-size: 16px;">Nouveau statut : <span style="font-weight: bold; text-transform: uppercase; color: #f97316;">${statusText}</span></p>
            </div>

            <p>${statusMessage}</p>
            
            <br/>
            <p style="font-size: 14px; color: #666;">L'équipe ZORANDO Algérie</p>
          </div>
          <div style="text-align: center; padding-top: 20px; font-size: 12px; color: #999;">
            <p>© ${new Date().getFullYear()} ZORANDO Algérie. Tous droits réservés.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend API error (status update):', error);
      let errorMsg = JSON.stringify(error);
      if (errorMsg.includes('422') || errorMsg.includes('validation_error')) {
        if (fromEmail.includes('onboarding@resend.dev')) {
          errorMsg = "Erreur 422 : Impossible d'envoyer aux clients avec 'onboarding@resend.dev'. Changez l'email d'expédition.";
        } else {
          errorMsg = `Erreur 422 : L'email '${fromEmail}' n'est pas autorisé par Resend.`;
        }
      }
      await logEmail(orderId, customerEmail, subject, 'error', errorMsg);
    } else {
      console.log(`Status update email sent: ${data?.id}`);
      await logEmail(orderId, customerEmail, subject, 'success');
    }
  } catch (error: any) {
    console.error('Failed to send order status email:', error);
    await logEmail(orderId, customerEmail, subject, 'error', error.message);
  }
};

const escapeEmailHtml = (input: string) =>
  String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const getEmailConfigStatus = async () => {
  const apiKey = await getApiKey();
  const fromEmail = await getFromEmail();
  return {
    configured: Boolean(apiKey),
    fromEmail,
  };
};

export interface SendCustomerEmailParams {
  to: string;
  customerName?: string;
  subject: string;
  message: string;
  voucherCode?: string;
  voucherAmount?: number;
  voucherMinCart?: number;
  voucherExpiresAt?: string | null;
}

export interface SendCustomerEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export const sendCustomerCustomEmail = async (params: SendCustomerEmailParams): Promise<SendCustomerEmailResult> => {
  const to = (params.to || '').trim();
  const subject = (params.subject || '').trim();
  const rawMessage = (params.message || '').trim();

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { success: false, error: 'Adresse email destinataire invalide.' };
  }
  if (!subject) {
    return { success: false, error: "L'objet de l'email est obligatoire." };
  }
  if (!rawMessage) {
    return { success: false, error: 'Le message de l\'email est obligatoire.' };
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    const errMsg = "Clé API Resend manquante. Configurez votre clé Resend dans Paramètres > Compte (ou RESEND_API_KEY) pour envoyer des emails automatiquement.";
    await logEmail(null, to, subject, 'error', errMsg);
    return { success: false, error: errMsg };
  }

  const safeName = escapeEmailHtml(params.customerName?.trim() || 'Cher client');
  const safeMessageHtml = escapeEmailHtml(rawMessage).replace(/\r?\n/g, '<br/>');

  let voucherBlock = '';
  if (params.voucherCode && params.voucherAmount) {
    const formattedAmount = `${Math.round(Number(params.voucherAmount)).toLocaleString('fr-FR')} DA`;
    const minCartVal = Number(params.voucherMinCart || 0);
    const minCartLine = minCartVal > 0
      ? `<p style="margin: 6px 0 0; font-size: 13px; color: #52525b;">Valable dès <strong>${Math.round(minCartVal).toLocaleString('fr-FR')} DA</strong> d'achats (hors livraison).</p>`
      : `<p style="margin: 6px 0 0; font-size: 13px; color: #52525b;">Utilisable immédiatement sur vos achats (hors livraison).</p>`;
    const expLine = params.voucherExpiresAt
      ? `<p style="margin: 4px 0 0; font-size: 12px; color: #71717a;">Date d'expiration : ${new Date(params.voucherExpiresAt).toLocaleDateString('fr-FR')}</p>`
      : '';

    voucherBlock = `
      <div style="margin: 24px 0; padding: 20px; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; text-align: center;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #c2410c; font-weight: 700;">Votre Bon d'Achat ZORANDO</p>
        <p style="margin: 8px 0; font-size: 28px; font-weight: 800; color: #ea580c;">-${formattedAmount}</p>
        <div style="display: inline-block; padding: 8px 18px; background-color: #ffffff; border: 1px dashed #fb923c; border-radius: 6px; font-family: monospace; font-size: 18px; font-weight: 700; color: #18181b; letter-spacing: 1px;">
          ${escapeEmailHtml(params.voucherCode)}
        </div>
        ${minCartLine}
        ${expLine}
        <div style="margin-top: 16px;">
          <a href="https://www.zorando.com/account/vouchers" style="display: inline-block; padding: 10px 22px; background-color: #ff6b00; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
            Voir mon bon dans mon espace client
          </a>
        </div>
      </div>
    `;
  }

  try {
    const resend = new Resend(apiKey);
    const fromEmail = await getFromEmail();

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b; background-color: #ffffff;">
          <div style="text-align: center; padding: 24px 0 16px; border-bottom: 1px solid #f4f4f5;">
            <span style="font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #ff6b00;">ZORANDO</span>
          </div>
          <div style="padding: 28px 24px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin-top: 20px;">
            <p style="margin: 0 0 14px; font-size: 16px; font-weight: 600;">Bonjour ${safeName},</p>
            <div style="font-size: 15px; line-height: 1.65; color: #27272a;">
              ${safeMessageHtml}
            </div>
            ${voucherBlock}
            <p style="margin: 24px 0 0; font-size: 13px; color: #71717a;">
              À très bientôt sur <a href="https://www.zorando.com" style="color: #ff6b00; text-decoration: none; font-weight: 600;">www.zorando.com</a>
            </p>
          </div>
          <div style="text-align: center; padding: 18px 0; font-size: 12px; color: #a1a1aa;">
            © ${new Date().getFullYear()} ZORANDO Algérie. Tous droits réservés.
          </div>
        </div>
      `,
    });

    if (error) {
      let errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
      if (errorMsg.includes('422') || errorMsg.includes('validation_error')) {
        if (fromEmail.includes('onboarding@resend.dev')) {
          errorMsg = "Erreur 422 : L'expéditeur 'onboarding@resend.dev' ne permet pas d'envoyer aux clients. Configurez votre domaine dans Paramètres > Compte.";
        } else {
          errorMsg = `Erreur 422 : L'adresse d'expédition '${fromEmail}' n'est pas validée sur Resend.`;
        }
      }
      await logEmail(null, to, subject, 'error', errorMsg);
      return { success: false, error: errorMsg };
    }

    await logEmail(null, to, subject, 'success');
    return { success: true, id: data?.id };
  } catch (err: any) {
    const errMsg = err?.message || "Erreur lors de l'envoi de l'email";
    await logEmail(null, to, subject, 'error', errMsg);
    return { success: false, error: errMsg };
  }
};

