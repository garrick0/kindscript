import { createUser, User } from '../domain/user';

export function registerUser(name: string, email: string): User {
  const user = createUser(name, email);
  console.log('Registered:', user.name);
  return user;
}
