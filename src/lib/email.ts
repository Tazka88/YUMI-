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

const getApiKey = async () => {
  const now = Date.now();
  if (cachedApiKey && (now - lastCacheTime < CACHE_TTL)) {
    return cachedApiKey;
  }

  // Check settings first, as user-provided settings should take priority
  try {
    const [row] = await sql`SELECT value FROM settings WHERE key = 'resend_api_key'`;
    if (row?.value && row.value.trim() !== '' && !row.value.includes('your_resend_api_key')) {
      cachedApiKey = row.value.trim();
      lastCacheTime = now;
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
    lastCacheTime = now;
    return cachedApiKey;
  }
  
  return null;
};

let cachedFromEmail: string | null = null;
let lastFromCacheTime = 0;

const getFromEmail = async () => {
  const now = Date.now();
  if (cachedFromEmail && (now - lastFromCacheTime < CACHE_TTL)) {
    return cachedFromEmail;
  }

  try {
    const [row] = await sql`SELECT value FROM settings WHERE key = 'resend_from_email'`;
    if (row?.value && row.value.trim() !== '') {
      cachedFromEmail = row.value.trim();
      lastFromCacheTime = now;
      return cachedFromEmail;
    }
  } catch (err) {
    // Ignore db error
  }

  if (process.env.RESEND_FROM_EMAIL) {
    cachedFromEmail = process.env.RESEND_FROM_EMAIL.trim();
    lastFromCacheTime = now;
    return cachedFromEmail;
  }

  const defaultEmail = 'ZORANDO <onboarding@resend.dev>';
  cachedFromEmail = defaultEmail;
  lastFromCacheTime = now;
  return defaultEmail;
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
