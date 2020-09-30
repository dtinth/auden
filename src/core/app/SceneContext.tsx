import firebase from 'firebase'
import React, { createContext, ReactNode, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { IScene, ISceneContext } from '../model'
import { ConnectorType, ErrorBoundary } from '../ui'
import { useConfig } from './ConfigContext'
import { CurrentScreenConnector } from './CurrentScreenConnector'
import { FirebaseData, FirebaseDataConnector } from './FirebaseConnector'
import { ScreenInfoConnector } from './ScreenInfoConnector'

export const SceneContext = createContext<ISceneContext | null>(null)

export function useSceneContext() {
  const sceneContext = useContext(SceneContext)
  if (!sceneContext) throw new Error('No scene context passed T_T')
  return sceneContext
}

export const SceneDataConnector: ConnectorType<
  { path: string[] },
  [FirebaseData]
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

export function CurrentSceneContextConnector(props: {
  renderScene: (scene: IScene) => ReactNode
  renderFallback: () => ReactNode
}) {
  const config = useConfig()
  const params = useParams<{ forceScreenId?: string }>()
  return (
    <CurrentScreenConnector>
      {(currentScreenId) => {
        const screenId = params.forceScreenId || currentScreenId
        if (!screenId) {
          return props.renderFallback()
        }
        return (
          <ScreenInfoConnector screenId={screenId}>
            {(info) => {
              if (!info || !info.scene) {
                return props.renderFallback()
              }
              const sceneName = info.scene
              const scene = config.scenes.filter((s) => s.name === sceneName)[0]
              const sceneContext = {
                dataRef: firebase
                  .database()
                  .ref('/screenData')
                  .child(screenId)
                  .child('data'),
              }
              return (
                <SceneContext.Provider value={sceneContext}>
                  <ErrorBoundary>{props.renderScene(scene)}</ErrorBoundary>
                </SceneContext.Provider>
              )
            }}
          </ScreenInfoConnector>
        )
      }}
    </CurrentScreenConnector>
  )
}
