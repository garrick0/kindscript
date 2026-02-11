export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'default' | 'lg';
  className?: string;
  children?: string;
}

export function Card({ variant = 'default', padding = 'default', className, children }: CardProps) {
  const classes = `card card-${variant} card-pad-${padding} ${className || ''}`.trim();
  return `<div class="${classes}">${children || ''}</div>`;
}

export function CardHeader({ children }: { children?: string }) {
  return `<div class="card-header">${children || ''}</div>`;
}

export function CardTitle({ children }: { children?: string }) {
  return `<h3 class="card-title">${children || ''}</h3>`;
}

export function CardContent({ children }: { children?: string }) {
  return `<div class="card-content">${children || ''}</div>`;
}

export function CardFooter({ children }: { children?: string }) {
  return `<div class="card-footer">${children || ''}</div>`;
}
