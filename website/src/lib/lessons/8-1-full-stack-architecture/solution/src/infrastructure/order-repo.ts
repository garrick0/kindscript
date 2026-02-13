export class OrderRepository {
  save(order: unknown): void {
    console.log('Saved:', order);
  }

  findById(id: string): unknown {
    return { id };
  }
}
