import firebase from 'firebase'
import React, { createContext, ReactNode, useContext } from 'react'
import { IScene, ISceneContext } from '../model'
import { ConnectorType, LargeLoadingContext } from '../ui'
import { useConfig } from './ConfigContext'
import { CurrentScreenConnector } from './CurrentScreenConnector'
import { FirebaseDataConnector } from './FirebaseConnector'
import { ScreenInfoConnector } from './ScreenInfoConnector'

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

export function CurrentSceneContextConnector(props: {
  renderScene: (scene: IScene) => ReactNode
  renderFallback: () => ReactNode
}) {
  const config = useConfig()
  return (
    <CurrentScreenConnector>
      {(currentScreenId) => {
        if (!currentScreenId) {
          return props.renderFallback()
        }
        return (
          <ScreenInfoConnector screenId={currentScreenId}>
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
                  .child(currentScreenId)
                  .child('data'),
              }
              return (
                <SceneContext.Provider value={sceneContext}>
                  <LargeLoadingContext>
                    {props.renderScene(scene)}
                  </LargeLoadingContext>
                </SceneContext.Provider>
              )
            }}
          </ScreenInfoConnector>
        )
      }}
    </CurrentScreenConnector>
  )
}
