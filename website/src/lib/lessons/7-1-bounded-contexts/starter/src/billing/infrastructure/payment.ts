export class PaymentGateway {
  charge(amount: number): boolean {
    return amount > 0;
  }
}
