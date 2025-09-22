// Development error overlay
export function showErrorOverlay(error) {
  if (import.meta.env.PROD) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    font-family: monospace;
    padding: 20px;
    box-sizing: border-box;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;

  overlay.innerHTML = `
    <div style="max-width: 800px; text-align: center;">
      <h1 style="color: #ff6b6b; margin-bottom: 20px;">Development Error</h1>
      <pre style="background: #1a1a1a; padding: 15px; border-radius: 5px; overflow: auto; max-height: 400px;">${error.stack}</pre>
      <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #4ecdc4; border: none; color: white; border-radius: 5px; cursor: pointer;">
        Dismiss
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

// Global error handler for development
if (import.meta.env.DEV) {
  window.addEventListener('error', (event) => {
    showErrorOverlay(event.error || new Error(event.message));
  });

  window.addEventListener('unhandledrejection', (event) => {
    showErrorOverlay(new Error(`Unhandled promise rejection: ${event.reason}`));
// Default export for compatibility
export default { showErrorOverlay };
