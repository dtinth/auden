import React from 'react'
import { config } from './config'
import { App } from './core/app'

export function AppContainer() {
  return <App config={config} />
}
