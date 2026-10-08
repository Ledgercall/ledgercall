import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

// Two pages, each its own chunk: the landing page at "/", the live demo at "/demo".
const App = lazy(() => import('./App.jsx'))
const Landing = lazy(() => import('./Landing.jsx'))
const isDemo = window.location.pathname.replace(/\/+$/, '') === '/demo'

createRoot(document.getElementById('root')).render(
  <Suspense fallback={null}>{isDemo ? <App /> : <Landing />}</Suspense>
)
