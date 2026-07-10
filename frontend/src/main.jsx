import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext'
import { NotificationProvider, NotificationListener } from './hooks/useNotification'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <NotificationListener />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </NotificationProvider>
  </StrictMode>,
)
