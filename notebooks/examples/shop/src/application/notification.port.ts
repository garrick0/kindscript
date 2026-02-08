export interface NotificationPort {
  sendOrderConfirmation(customerId: string, orderId: string): void;
  sendWelcomeEmail(customerId: string, name: string): void;
}
