import firebase from 'firebase'
import { Box, Text } from 'grommet'
import React, { useEffect } from 'react'
import { CurrentSceneContextConnector } from './SceneContext'
import { sessionId } from './SessionID'

export function AudienceRoot() {
  useEffect(() => {
    const uid = firebase.auth().currentUser?.uid
    if (!uid) return
    const ref = firebase.database().ref('presence').child(uid).child(sessionId)
    ref.set(firebase.database.ServerValue.TIMESTAMP)
    ref.onDisconnect().set(null)
  })
  return (
    <CurrentSceneContextConnector
      renderFallback={() => <AudienceFallbackView />}
      renderScene={(scene) => {
        const AudienceComponent = scene.audienceComponent
        if (!AudienceComponent) return <AudienceFallbackView />
        return <AudienceComponent />
      }}
    />
  )
}

function AudienceFallbackView() {
  return (
    <Box pad="large">
      <Text size="xlarge" color="light-6">
        Welcome!
      </Text>
    </Box>
  )
}
