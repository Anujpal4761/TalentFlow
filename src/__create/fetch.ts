// Global fetch override for development
const originalFetch = window.fetch;

window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  // Add development headers or logging here if needed
  return originalFetch(input, init);
};

export default window.fetch;
