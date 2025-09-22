import React, { useEffect, useState } from 'react';

// Type declaration for Vite's hot module replacement
declare const importMetaHot: {
  on: (event: string, callback: () => void) => void;
  off: (event: string, callback: () => void) => void;
};

// Use Vite's hot module replacement if available
const hot = (import.meta as any).hot;

export function HotReloadIndicator() {
  const [isHotReloading, setIsHotReloading] = useState(false);

  useEffect(() => {
    if (hot) {
      const handleHotUpdate = () => {
        setIsHotReloading(true);
        setTimeout(() => setIsHotReloading(false), 1000);
      };

      hot.on('vite:beforeUpdate', handleHotUpdate);

      return () => {
        hot.off('vite:beforeUpdate', handleHotUpdate);
      };
    }
  }, []);

  if (!hot || !isHotReloading) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)',
      backgroundSize: '200% 100%',
      animation: 'hotReloadBar 1s ease-in-out',
      zIndex: 9999,
    }} />
  );
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes hotReloadBar {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
// Default export for compatibility
export default HotReloadIndicator;
