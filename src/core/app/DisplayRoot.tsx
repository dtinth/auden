import { useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Box, Text } from 'grommet'
import React from 'react'
import { ErrorMessage, LoadingContext } from '../ui'
import { useConfig } from './ConfigContext'
import { SceneContext } from './SceneContext'

export function DisplayRoot() {
  const config = useConfig()
  const currentScreenRef = firebase.database().ref('/currentScreen')
  const currentScreenState = useFirebaseDatabase(currentScreenRef)
  const currentScreenId = currentScreenState.unstable_read()
  const sceneNameRef = firebase
    .database()
    .ref('/screenData')
    .child(currentScreenId)
    .child('info')
    .child('scene')
  const sceneNameState = useFirebaseDatabase(sceneNameRef)
  const sceneName = sceneNameState.unstable_read()
  const scene = config.scenes.filter((s) => s.name === sceneName)[0]
  if (!scene)
    return <ErrorMessage message={`Cannot find scene “${sceneName}”`} />
  if (!scene.presentationComponent)
    return (
      <Box pad="large">
        <Text size="xlarge" color="light-6">
          (No presentation component registered for scene “{sceneName}”.)
        </Text>
      </Box>
    )
  const PresentationComponent = scene.presentationComponent
  const sceneContext = {
    dataRef: firebase
      .database()
      .ref('/screenData')
      .child(currentScreenId)
      .child('data'),
  }
  return (
    <SceneContext.Provider value={sceneContext}>
      <LoadingContext>
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: '#000',
          }}
        >
          <PresentationComponent />
        </div>
      </LoadingContext>
    </SceneContext.Provider>
  )
}
