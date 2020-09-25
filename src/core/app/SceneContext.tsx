import React, { createContext, useContext } from 'react'
import { ISceneContext } from '../model'
import { ConnectorType } from '../ui'
import { FirebaseDataConnector } from './FirebaseConnector'

export const SceneContext = createContext<ISceneContext | null>(null)

export function useSceneContext() {
  const sceneContext = useContext(SceneContext)
  if (!sceneContext) throw new Error('No scene context passed T_T')
  return sceneContext
}

export const SceneDataConnector: ConnectorType<
  { path: string[] },
  [any, firebase.database.Reference]
> = (props) => {
  return (
    <FirebaseDataConnector
      baseRef={useSceneContext().dataRef}
      path={props.path}
    >
      {props.children}
    </FirebaseDataConnector>
  )
}
