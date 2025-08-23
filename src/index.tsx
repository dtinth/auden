import React from 'react'
import { createRoot } from 'react-dom/client'
import { AppContainer } from './AppContainer'
import { initializeApp } from './AppInitializer'
import { checkHashForEventpopTicketToken } from './core/app/EventpopIntegration'
import './index.css'
import * as serviceWorker from './serviceWorker'

initializeApp()
checkHashForEventpopTicketToken()

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<AppContainer />)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
