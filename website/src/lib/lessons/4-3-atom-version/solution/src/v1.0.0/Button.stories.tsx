import { Button, type ButtonProps } from './Button';

type Story = { args: ButtonProps };

export default { title: 'Atoms/Button/v1.0.0' };

export const Default: Story = { args: { label: 'Click me' } };
export const Outline: Story = { args: { variant: 'outline', label: 'Outline' } };
export const Disabled: Story = { args: { disabled: true, label: 'Disabled' } };
