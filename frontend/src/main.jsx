import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx';

// Global Axios Configuration
// In development, we use localhost:5000 (your backend). In production, we use the Vercel env variable.
axios.defaults.baseURL = import.meta.env.DEV ? 'http://localhost:5000' : (import.meta.env.VITE_API_URL || '');
axios.defaults.withCredentials = true;

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
