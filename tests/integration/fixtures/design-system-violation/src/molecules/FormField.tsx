import { Button } from '../atoms/Button';

export function FormField(label: string): string {
  return `<div>${label}: ${Button('Submit')}</div>`;
}
