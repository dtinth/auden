import React from 'react'
import { createRoot } from 'react-dom/client'
import { AppContainer } from './AppContainer'
import { initializeApp } from './AppInitializer'
import { checkHashForEventpopTicketToken } from './core/app/EventpopIntegration'
import './index.css'

initializeApp()
checkHashForEventpopTicketToken()

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<AppContainer />)
