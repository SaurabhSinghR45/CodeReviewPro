import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'

// Auto-clean stale hash routes from prior redirects
if (window.location.hash && (window.location.hash.includes('sign-in') || window.location.hash.includes('sign-up'))) {
  try {
    window.history.replaceState(null, '', window.location.pathname);
  } catch (e) {}
}
// Auto-route API calls to VITE_API_URL in production (e.g. Render backend)
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
if (API_BASE_URL) {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && (
      url.startsWith('/review') || 
      url.startsWith('/reviews') || 
      url.startsWith('/github') || 
      url.startsWith('/health') || 
      url.startsWith('/auth')
    )) {
      url = `${API_BASE_URL}${url}`;
    }
    return originalFetch(url, options);
  };
}

const rawKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
const isValidClerkKey = 
  rawKey.length > 25 && 
  (rawKey.startsWith('pk_test_') || rawKey.startsWith('pk_live_')) && 
  !rawKey.includes('your_') && 
  !rawKey.includes('placeholder')

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    {isValidClerkKey ? (
      <ClerkProvider
        publishableKey={rawKey}
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#18181b',
            colorText: '#ffffff',
            borderRadius: '1rem',
          }
        }}
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </ErrorBoundary>
)
