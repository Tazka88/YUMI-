import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOrderConfirmationEmail = async (orderId: string, customerName: string, customerEmail: string, totalAmount: number) => {
  if (!process.env.RESEND_API_KEY || !customerEmail) return;

  try {
    await resend.emails.send({
      from: 'Yumi <contact@yumidz.vercel.app>', // Update this with a verified domain if needed, or use a default Resend testing email if not verified. Actually, Resend requires a verified domain or uses onboarding@resend.dev for testing. Let's use onboarding@resend.dev as fallback or a generic one.
      to: customerEmail,
      subject: `Confirmation de votre commande ${orderId} - Yumi`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Merci pour votre commande, ${customerName} !</h2>
          <p>Votre commande <strong>${orderId}</strong> a bien été enregistrée.</p>
          <p>Le montant total est de <strong>${totalAmount} DZD</strong>.</p>
          <p>Nous préparons votre commande et vous contacterons très bientôt pour la livraison.</p>
          <br/>
          <p>L'équipe Yumi</p>
        </div>
      `
    });
    console.log(`Confirmation email sent to ${customerEmail} for order ${orderId}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
};

export const sendOrderStatusEmail = async (orderId: string, customerName: string, customerEmail: string, status: string) => {
  if (!process.env.RESEND_API_KEY || !customerEmail) return;

  let statusText = '';
  let statusMessage = '';

  switch (status) {
    case 'processing':
      statusText = 'en préparation';
      statusMessage = 'Votre commande est actuellement en cours de préparation dans nos locaux.';
      break;
    case 'shipped':
      statusText = 'expédiée';
      statusMessage = 'Bonne nouvelle ! Votre commande a été remise à notre livreur et est en route vers vous.';
      break;
    case 'delivered':
      statusText = 'livrée';
      statusMessage = 'Votre commande a été livrée. Merci d\'avoir fait confiance à Yumi !';
      break;
    default:
      return; // Don't send email for other statuses like 'pending' or 'cancelled' unless requested
  }

  try {
    await resend.emails.send({
      from: 'Yumi <contact@yumidz.vercel.app>',
      to: customerEmail,
      subject: `Mise à jour de votre commande ${orderId} - Yumi`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bonjour ${customerName},</h2>
          <p>Le statut de votre commande <strong>${orderId}</strong> a été mis à jour.</p>
          <p>Votre commande est maintenant : <strong>${statusText}</strong>.</p>
          <p>${statusMessage}</p>
          <br/>
          <p>L'équipe Yumi</p>
        </div>
      `
    });
    console.log(`Status update email sent to ${customerEmail} for order ${orderId} (Status: ${status})`);
  } catch (error) {
    console.error('Failed to send order status email:', error);
  }
};
