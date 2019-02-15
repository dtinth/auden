import { useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Box, Text } from 'grommet'
import React from 'react'
import { ErrorMessage, LoadingContext } from '../ui'
import { useConfig } from './ConfigContext'
import { SceneContext } from './SceneContext'

export function DisplayRoot() {
  const config = useConfig()
  const dataRef = firebase.database().ref('/currentScene')
  const dataState = useFirebaseDatabase(dataRef)
  const currentScene = dataState.unstable_read()
  const scene = config.scenes.filter(s => s.name === currentScene)[0]
  if (!scene)
    return <ErrorMessage message={`Cannot find scene “${currentScene}”`} />
  if (!scene.presentationComponent)
    return (
      <Box pad="large">
        <Text size="xlarge" color="light-6">
          (No presentation component registered for scene “{currentScene}”.)
        </Text>
      </Box>
    )
  const PresentationComponent = scene.presentationComponent
  const sceneContext = {
    dataRef: firebase
      .database()
      .ref('/scenes')
      .child(scene.name)
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
            background: '#000'
          }}
        >
          <PresentationComponent />
        </div>
      </LoadingContext>
    </SceneContext.Provider>
  )
}
