import React from 'react'
import firebase from 'firebase'
import { useConfig } from './ConfigContext'
import { useFirebaseDatabase } from 'fiery'
import { ErrorMessage, LoadingContext } from '../ui'
import { Box, Text } from 'grommet'
import { SceneContext } from './SceneContext'

export function AudienceRoot() {
  const config = useConfig()
  const dataRef = firebase.database().ref('/currentScene')
  const dataState = useFirebaseDatabase(dataRef)
  const currentScene = dataState.unstable_read()
  const scene = config.scenes.filter(s => s.name === currentScene)[0]
  if (!scene)
    return (
      <Box pad="large">
        <Text size="xlarge" color="light-6">
          Welcome!
        </Text>
      </Box>
    )
  const AudienceComponent = scene.audienceComponent
  if (!AudienceComponent)
    return (
      <Box pad="large">
        <Text size="xlarge" color="light-6">
          Welcome!
        </Text>
      </Box>
    )
  const sceneContext = {
    dataRef: firebase
      .database()
      .ref('/scenes')
      .child(scene.name)
  }
  return (
    <SceneContext.Provider value={sceneContext}>
      <LoadingContext>
        <AudienceComponent />
      </LoadingContext>
    </SceneContext.Provider>
  )
}
