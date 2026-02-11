import { Card, type CardProps } from './Card';

type Story = { args: CardProps };

export default { title: 'Molecules/Card/v1.0.0' };

export const Default: Story = { args: { children: 'Card content' } };
export const Elevated: Story = { args: { variant: 'elevated', children: 'Elevated card' } };
export const Outlined: Story = { args: { variant: 'outlined', children: 'Outlined card' } };
export const NoPadding: Story = { args: { padding: 'none', children: 'No padding' } };
