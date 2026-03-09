import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Global Axios Configuration
axios.defaults.baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
axios.defaults.withCredentials = true;

import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'


try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>,
  )
} catch (error) {
  console.error("Critical rendering error:", error);
  document.getElementById('root').innerHTML = `<div style="padding: 20px; color: red;"><h1>Critical Error</h1><pre>${error.message}</pre></div>`;
}
