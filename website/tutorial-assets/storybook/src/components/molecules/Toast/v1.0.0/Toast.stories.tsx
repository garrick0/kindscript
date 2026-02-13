import type { Meta, StoryObj } from '@storybook/react';
import { ToastContextProvider, useToast, SimpleToast } from './Toast';
import { Button } from '../../../atoms/Button/v1.0.0/Button';

const meta: Meta<typeof ToastContextProvider> = {
  title: 'Design System/Molecules/Toast/v1.0.0',
  component: ToastContextProvider,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <ToastContextProvider>
        <Story />
      </ToastContextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Toast Notifications</h3>
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => showToast.success('Operation completed successfully!')}>
          Show Success
        </Button>
        <Button onClick={() => showToast.error('Something went wrong!')}>
          Show Error
        </Button>
        <Button onClick={() => showToast.info('Here is some information')}>
          Show Info
        </Button>
        <Button onClick={() => showToast.warning('Please be careful!')}>
          Show Warning
        </Button>
      </div>
    </div>
  ),
};

export const WithPromise: Story = {
  render: () => {
    const simulateAsync = () => {
      const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.5) {
            resolve('Data loaded successfully!');
          } else {
            reject(new Error('Failed to load data'));
          }
        }, 2000);
      });

      showToast.promise(
        promise,
        {
          loading: 'Loading data...',
          success: 'Data loaded successfully!',
          error: (err) => `Error: ${err.message}`,
        }
      );
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Promise-based Toast</h3>
        <Button onClick={simulateAsync}>
          Simulate Async Operation (50% chance of success)
        </Button>
      </div>
    );
  },
};

export const CustomToastExample: Story = {
  render: () => {
    const showCustom = (type: 'success' | 'error' | 'info' | 'warning') => {
      showToast.custom(
        <CustomToast
          title={`${type.charAt(0).toUpperCase() + type.slice(1)} Notification`}
          description="This is a custom toast with more details and control over the content."
          type={type}
          onClose={() => showToast.dismiss()}
        />
      );
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Custom Toast Components</h3>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => showCustom('success')}>
            Custom Success
          </Button>
          <Button onClick={() => showCustom('error')}>
            Custom Error
          </Button>
          <Button onClick={() => showCustom('info')}>
            Custom Info
          </Button>
          <Button onClick={() => showCustom('warning')}>
            Custom Warning
          </Button>
        </div>
      </div>
    );
  },
};

export const Positions: Story = {
  render: () => {
    const positions = [
      'top-left',
      'top-center', 
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ] as const;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Toast Positions</h3>
        <div className="grid grid-cols-3 gap-4">
          {positions.map((position) => (
            <Button
              key={position}
              onClick={() => {
                showToast.info(`Toast at ${position}`, {
                  position,
                });
              }}
            >
              {position}
            </Button>
          ))}
        </div>
      </div>
    );
  },
};

export const LongContent: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Toast with Long Content</h3>
      <Button
        onClick={() => {
          showToast.custom(
            <CustomToast
              title="System Update Available"
              description="A new version of the application is available. This update includes bug fixes, performance improvements, and new features. Please save your work and refresh the page to get the latest version."
              type="info"
              onClose={() => showToast.dismiss()}
            />
          );
        }}
      >
        Show Long Toast
      </Button>
    </div>
  ),
};

export const MultipleToasts: Story = {
  render: () => {
    const showMultiple = () => {
      showToast.success('First toast message');
      setTimeout(() => showToast.info('Second toast message'), 500);
      setTimeout(() => showToast.warning('Third toast message'), 1000);
      setTimeout(() => showToast.error('Fourth toast message'), 1500);
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Multiple Toasts</h3>
        <Button onClick={showMultiple}>
          Show Multiple Toasts
        </Button>
      </div>
    );
  },
};