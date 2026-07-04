import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { setupListeners } from '@reduxjs/toolkit/query'
import { store } from './store/store'
import './index.css'
import App from './App.tsx'

// Required for RTK Query's refetchOnFocus / refetchOnReconnect to work —
// api.middleware (in store.ts) alone only enables caching/dedup, NOT the
// window focus/online event listeners. Without this call, those options
// silently do nothing even if enabled on an endpoint.
setupListeners(store.dispatch)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)