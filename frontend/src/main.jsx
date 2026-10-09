import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// `localhost` and `127.0.0.1` have separate localStorage stores. Keep the local
// demo on one canonical origin so polygons saved in Admin are also visible in
// Marketplace even when a URL was opened manually with the other hostname.
if (window.location.hostname === 'localhost') {
  const canonicalUrl = new URL(window.location.href)
  canonicalUrl.hostname = '127.0.0.1'
  window.location.replace(canonicalUrl.toString())
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
