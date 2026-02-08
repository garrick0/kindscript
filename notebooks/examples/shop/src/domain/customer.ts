/**
 * Customer entity with embedded Email value object validation.
 */
export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createCustomer(id: string, name: string, email: string): Customer {
  if (!validateEmail(email)) {
    throw new Error(`Invalid email: ${email}`);
  }
  return { id, name, email };
}
