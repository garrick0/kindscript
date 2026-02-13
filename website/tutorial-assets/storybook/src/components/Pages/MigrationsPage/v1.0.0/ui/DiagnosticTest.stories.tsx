import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { handlers } from '../../../../../mocks/generated/handlers';

const meta: Meta = {
  title: 'Debug/Diagnostic Test',
};

export default meta;

// Direct API test
function DirectAPITest() {
  const [state, setState] = useState<any>({
    loading: true,
    data: null,
    error: null,
    handlers: handlers.length
  });

  useEffect(() => {
    console.log('DirectAPITest: Starting fetch to /api/migrations');
    
    fetch('/api/migrations')
      .then(res => {
        console.log('DirectAPITest: Response received', {
          status: res.status,
          ok: res.ok,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries())
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.text(); // Get as text first to see what we get
      })
      .then(text => {
        console.log('DirectAPITest: Raw response text:', text);
        
        try {
          const json = JSON.parse(text);
          console.log('DirectAPITest: Parsed JSON:', json);
          setState({ loading: false, data: json, error: null, handlers: handlers.length });
        } catch (e) {
          console.error('DirectAPITest: JSON parse error:', e);
          setState({ loading: false, data: text, error: `Parse error: ${e}`, handlers: handlers.length });
        }
      })
      .catch(err => {
        console.error('DirectAPITest: Fetch error:', err);
        setState({ loading: false, data: null, error: err.message, handlers: handlers.length });
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Direct API Test</h1>
      <p>Handlers registered: {state.handlers}</p>
      <p>Loading: {String(state.loading)}</p>
      {state.error && (
        <div style={{ color: 'red' }}>
          <h2>Error:</h2>
          <pre>{state.error}</pre>
        </div>
      )}
      {state.data && (
        <div>
          <h2>Data:</h2>
          <pre>{JSON.stringify(state.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export const DirectFetch: StoryObj = {
  render: () => <DirectAPITest />,
};