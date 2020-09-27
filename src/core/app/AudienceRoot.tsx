import React from 'react'
import firebase from 'firebase'
import { useConfig } from './ConfigContext'
import { useFirebaseDatabase } from 'fiery'
import { ErrorMessage, LoadingContext } from '../ui'
import { Box, Text } from 'grommet'
import { SceneContext } from './SceneContext'

export function AudienceRoot() {
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
      .ref('/screenData')
      .child(currentScreenId)
      .child('data'),
  }
  return (
    <SceneContext.Provider value={sceneContext}>
      <LoadingContext>
        <AudienceComponent />
      </LoadingContext>
    </SceneContext.Provider>
  )
}
