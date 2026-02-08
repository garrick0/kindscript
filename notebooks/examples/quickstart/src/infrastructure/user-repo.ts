import { User } from '../domain/user';

const store: User[] = [];

export function saveUser(user: User): void {
  store.push(user);
}
