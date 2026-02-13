export interface PaymentProcessor {
  charge(amount: number): boolean;
}

export class Invoice {
  constructor(public readonly id: string, public readonly amount: number) {}

  process(processor: PaymentProcessor): boolean {
    return processor.charge(this.amount);
  }
}
