import { PaymentGateway } from '../infrastructure/payment';

export class Invoice {
  constructor(public readonly id: string, public readonly amount: number) {}

  process(): boolean {
    const gateway = new PaymentGateway();
    return gateway.charge(this.amount);
  }
}
