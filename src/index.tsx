import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from './AppContainer'
import { initializeApp } from './AppInitializer'
import { checkHashForEventpopTicketToken } from './core/app/EventpopIntegration'
import './index.css'

initializeApp()
checkHashForEventpopTicketToken()

ReactDOM.createRoot(document.getElementById('root')).render(<AppContainer />)
