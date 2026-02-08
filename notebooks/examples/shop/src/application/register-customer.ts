import { createCustomer, Customer } from '../domain/customer';
import { NotificationPort } from './notification.port';

export function registerCustomer(
  id: string,
  name: string,
  email: string,
  notifications: NotificationPort,
): Customer {
  const customer = createCustomer(id, name, email);
  notifications.sendWelcomeEmail(customer.id, customer.name);
  return customer;
}
