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

const getApiKey = async () => {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_resend_api_key') {
    return process.env.RESEND_API_KEY;
  }
  
  try {
    const [row] = await sql`SELECT value FROM settings WHERE key = 'resend_api_key'`;
    return row?.value || null;
  } catch (err) {
    return null;
  }
};

const getFromEmail = async () => {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  
  try {
    const [row] = await sql`SELECT value FROM settings WHERE key = 'resend_from_email'`;
    return row?.value || 'ZORANDO <onboarding@resend.dev>';
  } catch (err) {
    return 'ZORANDO <onboarding@resend.dev>';
  }
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
      await logEmail(orderId, customerEmail, subject, 'error', JSON.stringify(error));
    } else {
      console.log(`Confirmation email sent via Resend: ${data?.id}`);
      await logEmail(orderId, customerEmail, subject, 'success');
    }
  } catch (error: any) {
    console.error('Failed to send order confirmation email:', error);
    await logEmail(orderId, customerEmail, subject, 'error', error.message);
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
      await logEmail(orderId, customerEmail, subject, 'error', JSON.stringify(error));
    } else {
      console.log(`Status update email sent: ${data?.id}`);
      await logEmail(orderId, customerEmail, subject, 'success');
    }
  } catch (error: any) {
    console.error('Failed to send order status email:', error);
    await logEmail(orderId, customerEmail, subject, 'error', error.message);
  }
};
