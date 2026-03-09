console.log("🚀 BOOT: Script execution started");
document.body.insertAdjacentHTML('afterbegin', '<!-- APP BINDING IN PROGRESS -->');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

console.log("🚀 BOOT: Imports complete");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Crucial: Could not find #root element in index.html');
  }

  axios.defaults.baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
  axios.defaults.withCredentials = true;

  console.log("🚀 BOOT: Creating React root at:", axios.defaults.baseURL);

  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>
  );

  console.log("🚀 BOOT: Render call successful");
} catch (error) {
  console.error("❌ CRITICAL BOOT ERROR:", error);
  const errorBox = document.createElement('div');
  errorBox.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; color: #0f0; padding: 50px; z-index: 9999; font-family: monospace; overflow: auto;';
  errorBox.innerHTML = `
    <h1 style="color: #ff0;">🔴 BOOT FAILURE</h1>
    <p><strong>Error:</strong> ${error.message}</p>
    <p><strong>Stack:</strong> ${error.stack}</p>
    <hr>
    <p><em>Check Vercel Environment Variables: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY</em></p>
  `;
  document.body.appendChild(errorBox);
}
