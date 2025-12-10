import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './config/debugAPI.js' // Add debug helpers to window
import './config/loginTester.js' // Add login format tester
import './config/simpleDebug.js' // Add simple debug tool

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
