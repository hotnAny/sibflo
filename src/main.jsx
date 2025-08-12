import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppServicesProvider } from './contexts/AppServicesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppServicesProvider>
      <App />
    </AppServicesProvider>
  </StrictMode>,
)
