import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'dseg/css/dseg.css'
import './index.css'
import App from './App.tsx'

// Pre-load DSEG fonts so they're available for canvas rendering
Promise.all([
  document.fonts.load("bold 16px 'DSEG7-Classic'"),
  document.fonts.load("bold 16px 'DSEG7-Modern'"),
  document.fonts.load("bold 16px 'DSEG14-Classic'"),
  document.fonts.load("bold 16px 'DSEG14-Modern'"),
]).catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
