import { useEffect, useState } from 'react';

export function useDevServerHeartbeat() {
  const [isConnected, setIsConnected] = useState(true);
  const [lastHeartbeat, setLastHeartbeat] = useState(Date.now());

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const checkConnection = async () => {
      try {
        // Try to fetch a small resource to check if dev server is responding
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache'
        });

        if (response.ok) {
          setIsConnected(true);
          setLastHeartbeat(Date.now());
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        setIsConnected(false);
      }
    };

    // Check immediately
    checkConnection();

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return { isConnected, lastHeartbeat };
}
