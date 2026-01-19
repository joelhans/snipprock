import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@ngrok/mantle/theme'
import '@ngrok/mantle/mantle.css'
import './index.css'

import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider colorScheme="dark">
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
