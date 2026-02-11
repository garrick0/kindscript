export interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label: string;
  disabled?: boolean;
}

export function Button({ variant = 'default', size = 'md', label, disabled }: ButtonProps) {
  const className = `btn btn-${variant} btn-${size}`;
  return `<button class="${className}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}
