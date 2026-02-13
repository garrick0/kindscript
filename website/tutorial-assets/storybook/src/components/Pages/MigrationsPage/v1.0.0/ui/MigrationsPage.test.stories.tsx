import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';

const meta: Meta = {
  title: 'Debug/MSW Test',
};

export default meta;

// Simple component to test MSW
function MSWTest() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/migrations')
      .then(res => {
        console.log('Response status:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Fetched data:', data);
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>MSW Test - Migrations API</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export const TestMSW: StoryObj = {
  render: () => <MSWTest />,
};