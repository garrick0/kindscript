import { LessonFile } from '../lessons/types';

/**
 * Project templates for sandbox mode
 * Each template provides a starting point for different architectural patterns
 */

export interface SandboxTemplate {
  id: string;
  name: string;
  description: string;
  files: LessonFile[];
}

const CLEAN_ARCHITECTURE_TEMPLATE: LessonFile[] = [
  {
    path: 'src/domain/user.ts',
    contents: `// Domain layer - pure business logic
export interface User {
  id: string;
  name: string;
  email: string;
}

export class UserDomain {
  validateEmail(email: string): boolean {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  }
}
`,
  },
  {
    path: 'src/application/user-service.ts',
    contents: `// Application layer - use cases and ports
import { User } from '../domain/user';

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
}

export class UserService {
  constructor(private repository: UserRepository) {}

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const user: User = { id: crypto.randomUUID(), ...data };
    await this.repository.save(user);
    return user;
  }
}
`,
  },
  {
    path: 'src/infrastructure/user-repository.ts',
    contents: `// Infrastructure layer - external adapters
import { User } from '../domain/user';
import { UserRepository } from '../application/user-service';

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
}
`,
  },
  {
    path: 'src/kindscript.config.ts',
    contents: `import { Kind, Constraints } from 'kindscript';

// Define architectural layers
export const Domain = Kind<'Domain', {}, {
  noDependency: ['Application', 'Infrastructure']
}>('Domain');

export const Application = Kind<'Application', {}, {
  noDependency: ['Infrastructure']
}>('Application');

export const Infrastructure = Kind<'Infrastructure'>('Infrastructure');

// Assign files to layers
export const domainLayer = Instance(Domain, 'src/domain');
export const applicationLayer = Instance(Application, 'src/application');
export const infrastructureLayer = Instance(Infrastructure, 'src/infrastructure');
`,
  },
];

const HEXAGONAL_TEMPLATE: LessonFile[] = [
  {
    path: 'src/core/order.ts',
    contents: `// Core domain - business logic
export interface Order {
  id: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped';
}

export class OrderAggregate {
  constructor(private order: Order) {}

  addItem(productId: string, quantity: number): void {
    this.order.items.push({ productId, quantity });
  }

  confirm(): void {
    if (this.order.items.length === 0) {
      throw new Error('Cannot confirm empty order');
    }
    this.order.status = 'confirmed';
  }
}
`,
  },
  {
    path: 'src/ports/order-port.ts',
    contents: `// Ports - interfaces for adapters
import { Order } from '../core/order';

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
}

export interface PaymentGateway {
  charge(amount: number, orderId: string): Promise<boolean>;
}
`,
  },
  {
    path: 'src/adapters/postgres-order-repository.ts',
    contents: `// Adapters - implementations of ports
import { Order } from '../core/order';
import { OrderRepository } from '../ports/order-port';

export class PostgresOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    // Database logic here
    console.log('Saving order to Postgres:', order.id);
  }

  async findById(id: string): Promise<Order | null> {
    // Database query here
    return null;
  }
}
`,
  },
  {
    path: 'src/kindscript.config.ts',
    contents: `import { Kind, Constraints } from 'kindscript';

// Hexagonal architecture layers
export const Core = Kind<'Core', {}, {
  noDependency: ['Ports', 'Adapters']
}>('Core');

export const Ports = Kind<'Ports', {}, {
  noDependency: ['Adapters']
}>('Ports');

export const Adapters = Kind<'Adapters'>('Adapters');

// Map to hexagons
export const coreHex = Instance(Core, 'src/core');
export const portsHex = Instance(Ports, 'src/ports');
export const adaptersHex = Instance(Adapters, 'src/adapters');
`,
  },
];

const DDD_TEMPLATE: LessonFile[] = [
  {
    path: 'src/domain/product/product.ts',
    contents: `// Domain-Driven Design - Product bounded context
export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public price: number
  ) {
    if (price < 0) {
      throw new Error('Price cannot be negative');
    }
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Price cannot be negative');
    }
    this.price = newPrice;
  }
}
`,
  },
  {
    path: 'src/domain/product/product-repository.ts',
    contents: `// Repository interface (domain layer)
import { Product } from './product';

export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
}
`,
  },
  {
    path: 'src/domain/order/order.ts',
    contents: `// Order bounded context
export class Order {
  private items: Array<{ productId: string; quantity: number }> = [];

  addItem(productId: string, quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.items.push({ productId, quantity });
  }

  getItems() {
    return [...this.items];
  }
}
`,
  },
  {
    path: 'src/infrastructure/product-repository-impl.ts',
    contents: `// Infrastructure - repository implementation
import { Product } from '../domain/product/product';
import { ProductRepository } from '../domain/product/product-repository';

export class InMemoryProductRepository implements ProductRepository {
  private products = new Map<string, Product>();

  async save(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }
}
`,
  },
  {
    path: 'src/kindscript.config.ts',
    contents: `import { Kind, Constraints } from 'kindscript';

// DDD layers
export const Domain = Kind<'Domain', {}, {
  noDependency: ['Infrastructure']
}>('Domain');

export const Infrastructure = Kind<'Infrastructure'>('Infrastructure');

// Bounded contexts (within domain)
export const ProductContext = Kind<'ProductContext'>('ProductContext');
export const OrderContext = Kind<'OrderContext'>('OrderContext');

// Map to directories
export const domainLayer = Instance(Domain, 'src/domain');
export const infraLayer = Instance(Infrastructure, 'src/infrastructure');

export const productBC = Instance(ProductContext, 'src/domain/product');
export const orderBC = Instance(OrderContext, 'src/domain/order');
`,
  },
];

const EMPTY_TEMPLATE: LessonFile[] = [
  {
    path: 'src/index.ts',
    contents: `// Your code here
export function hello() {
  return 'Hello from KindScript!';
}
`,
  },
  {
    path: 'src/kindscript.config.ts',
    contents: `import { Kind, Constraints } from 'kindscript';

// Define your architectural patterns here
`,
  },
];

export const SANDBOX_TEMPLATES: SandboxTemplate[] = [
  {
    id: 'clean',
    name: 'Clean Architecture',
    description: 'Domain → Application → Infrastructure layers with strict dependency rules',
    files: CLEAN_ARCHITECTURE_TEMPLATE,
  },
  {
    id: 'hexagonal',
    name: 'Hexagonal Architecture',
    description: 'Ports & Adapters pattern with core business logic isolated from external concerns',
    files: HEXAGONAL_TEMPLATE,
  },
  {
    id: 'ddd',
    name: 'Domain-Driven Design',
    description: 'Bounded contexts with domain layer separated from infrastructure',
    files: DDD_TEMPLATE,
  },
  {
    id: 'empty',
    name: 'Empty Project',
    description: 'Start from scratch with just a basic structure',
    files: EMPTY_TEMPLATE,
  },
];

/**
 * Get a template by ID
 */
export function getTemplate(id: string): SandboxTemplate | undefined {
  return SANDBOX_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get default template (Clean Architecture)
 */
export function getDefaultTemplate(): SandboxTemplate {
  return SANDBOX_TEMPLATES[0];
}
