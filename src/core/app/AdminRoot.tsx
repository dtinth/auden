import { useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Box, Grid, Heading, Menu, RoutedAnchor } from 'grommet'
import { Add } from 'grommet-icons'
import { History } from 'history'
import React from 'react'
import {
  ActionButton,
  ActionCheckbox,
  ErrorMessage,
  InlineLoadingContext,
  LoadingContext,
  Panel,
  ToolbarFiller,
} from '../ui'
import { useConfig } from './ConfigContext'
import { CurrentScreenConnector } from './CurrentScreenConnector'
import { SceneContext } from './SceneContext'
import { ScreenInfoConnector } from './ScreenInfoConnector'

export function AdminRoot(props: {
  sceneName?: string
  screenId?: string
  history: History
}) {
  return (
    <Grid
      rows={['auto']}
      columns={['16rem', 'auto']}
      gap="medium"
      pad="small"
      areas={[
        { name: 'nav', start: [0, 0], end: [0, 0] },
        { name: 'main', start: [1, 0], end: [1, 0] },
      ]}
    >
      <Box gridArea="nav">
        <AdminNavigation />
      </Box>
      <Box gridArea="main">
        {props.screenId ? (
          <LoadingContext>
            <ScreenBackstage screenId={props.screenId} />
          </LoadingContext>
        ) : (
          <AdminEmptyState />
        )}
      </Box>
    </Grid>
  )
}

function AdminNavigation() {
  const config = useConfig()
  return (
    <Panel
      title="Screens"
      bottomBar={
        <>
          <ToolbarFiller />
          <Menu
            icon={<Add color="light-1" />}
            items={config.scenes.map((scene, i) => ({
              label: scene.name,
              onClick: () => {
                const screenDataRef = firebase
                  .database()
                  .ref('/screenData')
                  .push()
                screenDataRef.set({
                  info: { scene: scene.name, title: scene.name },
                })
                firebase.database().ref('/screenList').push(screenDataRef.key)
              },
            }))}
          />
        </>
      }
    >
      <LoadingContext>
        <ScreenListConnector>
          {(screenIds) =>
            screenIds.length ? (
              screenIds.map((screenId) => (
                // TODO: #10 RoutedAnchor deprecated
                // https://github.com/grommet/grommet/issues/2855
                <RoutedAnchor path={`/admin/screens/${screenId}`}>
                  <Box pad="small">
                    <InlineLoadingContext description={'get screen title'}>
                      <ScreenInfoConnector key={screenId} screenId={screenId}>
                        {(info) =>
                          info ? (
                            <>
                              {info.title}
                              <CurrentScreenConnector>
                                {(currentScreen) =>
                                  screenId === currentScreen ? ' [active]' : ''
                                }
                              </CurrentScreenConnector>
                            </>
                          ) : null
                        }
                      </ScreenInfoConnector>
                    </InlineLoadingContext>
                  </Box>
                </RoutedAnchor>
              ))
            ) : (
              <Box pad="small">No screens, create one!</Box>
            )
          }
        </ScreenListConnector>
      </LoadingContext>
    </Panel>
  )
}

function ScreenListConnector(props: {
  children: (screenIds: string[]) => React.ReactNode
}) {
  const dataRef = firebase.database().ref('/screenList')
  const dataState = useFirebaseDatabase(dataRef)
  const data = dataState.unstable_read()
  const screenIds: string[] = Object.values(data || {})
  return <>{props.children(screenIds)}</>
}

async function deleteScreen(screenId: string) {
  const screenList = (
    await firebase.database().ref('/screenList').once('value')
  ).val()
  const orderKey = Object.keys(screenList || {}).find(
    (k) => screenList[k] === screenId
  )
  if (!orderKey) {
    return
  }
  await Promise.all([
    firebase.database().ref('/screenData').child(screenId).set(null),
    firebase.database().ref('/screenList').child(orderKey).set(null),
  ])
}

function AdminEmptyState() {
  return <Box pad="small">No active screen. Create one on the left.</Box>
}

export function ScreenBackstage(props: { screenId: string }) {
  const config = useConfig()
  const screenId = props.screenId
  const dataRef = firebase
    .database()
    .ref('/screenData')
    .child(screenId)
    .child('info')
    .child('scene')
  const dataState = useFirebaseDatabase(dataRef)
  const sceneType = dataState.unstable_read()
  if (!sceneType) {
    return <AdminEmptyState />
  }
  const scene = config.scenes.find((s) => s.name === sceneType)
  if (!scene) {
    return <ErrorMessage message={'Scene type ' + sceneType + ' not found'} />
  }
  const BackstageComponent = scene.backstageComponent || FallbackBackstage
  const sceneContext = {
    dataRef: firebase
      .database()
      .ref('/screenData')
      .child(screenId)
      .child('data'),
  }
  return (
    <>
      <Box direction="row" gap="medium" align="center">
        <Heading margin={{ vertical: 'small' }}>
          <InlineLoadingContext description="get screen title">
            <ScreenInfoConnector screenId={screenId}>
              {(info, actions) => <>{info?.title}</>}
            </ScreenInfoConnector>
          </InlineLoadingContext>
        </Heading>
        <InlineLoadingContext description="screen actions">
          <Box direction="row" gap="small" align="center" flex>
            <Box>
              <ScreenInfoConnector screenId={screenId}>
                {(info, actions) => (
                  <ActionButton
                    label="Rename"
                    onClick={async () => {
                      const newTitle = window.prompt(
                        'New name plox',
                        info?.title
                      )
                      if (newTitle) {
                        actions.changeTitleTo(newTitle)
                      }
                    }}
                  />
                )}
              </ScreenInfoConnector>
            </Box>
            <Box>
              <CurrentScreenConnector>
                {(currentScreen, setCurrentScreen) => (
                  <ActionCheckbox
                    checked={currentScreen === screenId}
                    description={`set currentScreen to "${screenId}"`}
                    onChange={() =>
                      setCurrentScreen(
                        currentScreen === screenId ? null : screenId
                      )
                    }
                    toggle
                    label="active"
                  />
                )}
              </CurrentScreenConnector>
            </Box>
            <Box flex />
            <Box>
              <ActionButton
                label="Delete"
                onClick={async () => {
                  if (window.confirm('Delete screen?')) {
                    await deleteScreen(screenId)
                  }
                }}
              />
            </Box>
          </Box>
        </InlineLoadingContext>
      </Box>

      <SceneContext.Provider value={sceneContext}>
        <LoadingContext>
          <BackstageComponent />
        </LoadingContext>
      </SceneContext.Provider>
    </>
  )
}

export function FallbackBackstage() {
  return <Box pad="small">No backstage UI is defined for this scene.</Box>
}
