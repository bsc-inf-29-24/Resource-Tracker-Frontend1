import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/styles/global.css'
import './assets/pages/auth/Authentication.css';
import './assets/components/layout/Layout.css';
import './assets/components/feedback/Feedback.css'
import './assets/components/layout/Page-header.css'
import App from './App.jsx'

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
