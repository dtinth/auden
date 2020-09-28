import { Box, Text } from 'grommet'
import React from 'react'
import { CurrentSceneContextConnector } from './SceneContext'

export function AudienceRoot() {
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
