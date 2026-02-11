import { saveUser } from '../infrastructure/user-repo';

export interface User {
  id: string;
  name: string;
  email: string;
}

export function createUser(name: string, email: string): User {
  const user = { id: Math.random().toString(36), name, email };
  saveUser(user); // BAD: domain reaching into infrastructure
  return user;
}
