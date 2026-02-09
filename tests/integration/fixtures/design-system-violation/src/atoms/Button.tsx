// VIOLATION: atom imports from organism (atoms -> organisms is forbidden)
import { LoginForm } from '../organisms/LoginForm';

export function Button(label: string): string {
  return `<button>${label}${LoginForm()}</button>`;
}
