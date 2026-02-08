import { NotificationPort } from '../application/notification.port';

/**
 * Console-based notification adapter.
 * In production this would use an email service (SendGrid, SES, etc.)
 */
export class EmailNotification implements NotificationPort {
  sendOrderConfirmation(customerId: string, orderId: string): void {
    console.log(`[EMAIL] Order confirmation sent to customer ${customerId} for order ${orderId}`);
  }

  sendWelcomeEmail(customerId: string, name: string): void {
    console.log(`[EMAIL] Welcome email sent to ${name} (${customerId})`);
  }
}
