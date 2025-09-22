import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

async function start() {
  // Only start MSW in development mode
  if (import.meta.env.DEV && import.meta.env.MODE === 'development') {
    console.log('Starting MSW...');
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        onUnhandledRequest: 'bypass',
        quiet: false,
      });
      console.log('MSW started successfully');

      // Test if MSW is working
      const testResponse = await fetch('/api/jobs?test=1');
      console.log('MSW test response status:', testResponse.status);
      if (testResponse.status === 404 || testResponse.headers.get('content-type')?.includes('text/html')) {
        console.warn('MSW might not be intercepting requests properly');
      } else {
        console.log('MSW is intercepting requests correctly');
      }
    } catch (error) {
      console.error('MSW failed to start:', error);
    }
  } else {
    console.log('Running in production mode - MSW disabled');
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

start();
