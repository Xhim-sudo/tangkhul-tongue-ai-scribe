import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Prevent unhandled promise rejections (e.g. stale auth tokens) from crashing the app
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection caught globally:', event.reason);
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
