import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { PrototypeProvider } from './state/PrototypeContext'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PrototypeProvider>
        <App />
      </PrototypeProvider>
    </BrowserRouter>
  </StrictMode>,
)
