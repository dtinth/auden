import enableHotReload from 'enable-hot-reload'
import React from 'react'
import { config } from './config'
import { App } from './core/app'

const hot = enableHotReload(module)

export const AppContainer = hot(
  React,
  function AppContainer() {
    return <App config={config} />
  },
  'AppContainer'
)
