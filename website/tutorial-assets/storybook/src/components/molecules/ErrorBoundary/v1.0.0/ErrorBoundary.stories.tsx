import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary, useErrorHandler } from './ErrorBoundary';
import { useState } from 'react';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Design System/Molecules/ErrorBoundary/v1.0.0',
  component: ErrorBoundary,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Component that throws an error
function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('This is a test error from BuggyComponent!');
  }
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Component is working fine</h2>
      <p>No errors here!</p>
    </div>
  );
}

// Component with button to trigger error
function ErrorTrigger() {
  const [shouldThrow, setShouldThrow] = useState(false);
  
  return (
    <ErrorBoundary>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Error Boundary Demo</h1>
        <p className="mb-4">Click the button below to trigger an error and see the error boundary in action.</p>
        
        <button
          onClick={() => setShouldThrow(true)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Trigger Error
        </button>
        
        <div className="mt-8">
          <BuggyComponent shouldThrow={shouldThrow} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export const Default: Story = {
  render: () => <ErrorTrigger />,
};

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const WithCustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Custom Error Handler</h2>
          <p className="text-yellow-700 mb-4">Error: {error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Reset Application
          </button>
        </div>
      )}
    >
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const WithErrorLogging: Story = {
  render: () => (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.log('Error logged to monitoring service:', {
          error: error.toString(),
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        });
      }}
    >
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

// Component using the hook
function HookExample() {
  const { throwError } = useErrorHandler();
  
  const handleAsyncError = async () => {
    try {
      // Simulate async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Async operation failed!')), 1000);
      });
    } catch (error) {
      throwError(error as Error);
    }
  };
  
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">useErrorHandler Hook Demo</h2>
      <p className="mb-4">This demonstrates using the hook to throw errors programmatically.</p>
      <button
        onClick={handleAsyncError}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Trigger Async Error
      </button>
    </div>
  );
}

export const WithHook: Story = {
  render: () => (
    <ErrorBoundary>
      <HookExample />
    </ErrorBoundary>
  ),
};