import { FormField } from '../molecules/FormField';

export function LoginForm(): string {
  return `<form>${FormField('Username')}${FormField('Password')}</form>`;
}
