import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

async function start() {
  if (import.meta.env.DEV) {
    console.log('Starting MSW...');
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        onUnhandledRequest: 'bypass', // This helps with debugging
      });
      console.log('MSW started successfully');

      // Test if MSW is working by making a test request
      try {
        const testResponse = await fetch('/api/candidates?test=1');
        console.log('MSW test response status:', testResponse.status);
        if (testResponse.status === 404 || testResponse.headers.get('content-type')?.includes('text/html')) {
          console.warn('MSW might not be intercepting requests properly');
        }
      } catch (testError) {
        console.warn('MSW test request failed:', testError);
      }
    } catch (error) {
      console.error('MSW failed to start:', error);
    }
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

start();
