import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App'

registerSW({ immediate: true })

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
    <SpeedInsights />
  </StrictMode>
)
