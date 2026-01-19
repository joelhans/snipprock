import './polyfills.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, useTheme } from '@ngrok/mantle/theme'
import '@ngrok/mantle/mantle.css'
import './index.css'
// Ensure Prism is available globally before any components import/use it
import './prism-setup.js'

import App from './App'

function ForceDark() {
  const [, setTheme] = useTheme()
  React.useEffect(() => {
    try {
      setTheme('dark')
    } catch {}
  }, [setTheme])
  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ForceDark />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
