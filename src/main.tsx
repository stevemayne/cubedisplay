import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'dseg/css/dseg.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
