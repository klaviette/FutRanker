import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import './series.css'
import SeriesOdds from './SeriesOdds.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SeriesOdds />
  </StrictMode>,
)
