import { Box, Text } from 'grommet'
import React, { ReactNode } from 'react'
import { CurrentSceneContextConnector } from './SceneContext'

export function DisplayRoot() {
  return (
    <CurrentSceneContextConnector
      renderFallback={() => <DisplayFallbackView />}
      renderScene={(scene) => {
        const PresentationComponent = scene.presentationComponent
        if (!PresentationComponent) {
          return (
            <Box pad="large">
              <Text size="xlarge" color="light-6">
                (No presentation component registered.)
              </Text>
            </Box>
          )
        }
        return (
          <Backdrop>
            <PresentationComponent />
          </Backdrop>
        )
      }}
    />
  )
}

function Backdrop(props: { children: ReactNode }) {
  return (
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
      {props.children}
    </div>
  )
}

function DisplayFallbackView() {
  return (
    <Backdrop>
      <Box pad="large">
        <Text size="xlarge" color="light-6">
          Welcome!
        </Text>
      </Box>
    </Backdrop>
  )
}
