import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

const originalFetch = window.fetch;
window.fetch = function(url, config = {}) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  if (backendUrl && url.toString().includes(backendUrl)) {
    config.headers = {
      ...config.headers, 
      "ngrok-skip-browser-warning": "true", 
    };
  }
  return originalFetch(url, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
