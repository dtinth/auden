import React, { Suspense, useCallback } from 'react'
import { useConfig } from './ConfigContext'
import {
  Tabs,
  Tab,
  Box,
  Text,
  CheckBox,
  Menu,
  Grid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  RoutedAnchor,
  Heading,
} from 'grommet'
import λ from 'react-lambda'
import firebase from 'firebase'
import { IScene } from '../model'
import { History } from 'history'
import { useFirebaseDatabase } from 'fiery'
import {
  InlineLoadingContext,
  handlePromise,
  LoadingContext,
  ActionButton,
  ActionCheckbox,
  ErrorMessage,
  ConnectorType,
} from '../ui'
import { SceneContext } from './SceneContext'
import { Add } from 'grommet-icons'
import { Link } from 'react-router-dom'

export function AdminRoot(props: {
  sceneName?: string
  screenId?: string
  history: History
}) {
  const config = useConfig()

  if (props.screenId) {
    return (
      <Grid
        rows={['auto']}
        columns={['16rem', 'auto']}
        gap="small"
        pad="small"
        areas={[
          { name: 'nav', start: [0, 0], end: [0, 0] },
          { name: 'main', start: [1, 0], end: [1, 0] },
        ]}
      >
        <Box gridArea="nav">
          <Navigation />
        </Box>
        <Box gridArea="main">
          <LoadingContext>
            <ScreenBackstage screenId={props.screenId} />
          </LoadingContext>
        </Box>
      </Grid>
    )
  }

  // TODO: Delete this
  return (
    <div>
      <Tabs
        activeIndex={
          config.scenes.findIndex((s) => s.name === props.sceneName!) + 1
        }
        onActive={(index) => {
          if (index === 0) {
            props.history.push('/admin')
          } else {
            props.history.push('/admin/' + config.scenes[index - 1].name)
          }
        }}
      >
        <Tab title="home">
          <Box pad="medium">Nothing to see here — please select a scene!</Box>
        </Tab>
        {config.scenes.map((scene, i) => (
          <Tab
            title={
              λ(() => {
                const dataRef = firebase.database().ref('/currentScene')
                // Using hooks in λ is okay but now that `react-script` refuses to compile this, we should use `fiery.Data` instead.
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const dataState = useFirebaseDatabase(dataRef)
                const weight = dataState.data === scene.name ? 'bold' : 'normal'
                return <Text weight={weight}>{scene.name}</Text>
              }) as any
            }
            key={i}
          >
            <Backstage scene={scene} />
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}

function Navigation() {
  const config = useConfig()
  return (
    <Card background="dark-1">
      <CardHeader pad="small" background="dark-2">
        Screens
      </CardHeader>
      <CardBody>
        <LoadingContext>
          <ScreenListConnector>
            {(screenIds) =>
              screenIds.length ? (
                screenIds.map((screenId) => (
                  // TODO: RoutedAnchor deprecated https://github.com/grommet/grommet/issues/2855
                  <RoutedAnchor path={`/admin/screens/${screenId}`}>
                    <Box pad="small">
                      <InlineLoadingContext description={'get screen title'}>
                        <ScreenInfoConnector key={screenId} screenId={screenId}>
                          {(info) =>
                            info ? (
                              <>
                                {
                                  // TODO: #5 Show which screen is active
                                  info.title
                                }
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
      </CardBody>
      <CardFooter pad={{ horizontal: 'small' }} background="dark-2">
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
      </CardFooter>
    </Card>
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

const ScreenInfoConnector: ConnectorType<
  { screenId: string },
  [any, { changeTitleTo: (newName: string) => Promise<void> }]
> = (props) => {
  const dataRef = firebase
    .database()
    .ref('/screenData')
    .child(props.screenId)
    .child('info')
  const dataState = useFirebaseDatabase(dataRef)
  const data = dataState.unstable_read()
  return (
    <>
      {props.children(data, {
        changeTitleTo: useCallback(
          async (newName) => {
            await dataRef.child('title').set(newName)
          },
          [dataRef]
        ),
      })}
    </>
  )
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
      <Box margin="xsmall" direction="row" gap="small" align="center">
        <Heading margin={{ vertical: 'small', horizontal: 'small' }}>
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
                  // TODO: #7 Allow deactivating a screen
                  // TODO: #8 Allow deleting a screen
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

      <Box margin="xsmall" border="all" direction="column">
        <Box
          border="bottom"
          background="dark-1"
          direction="row"
          pad={{ vertical: 'xsmall', horizontal: 'small' }}
        >
          <Box flex>
            <Text weight="bold">{scene.name}</Text>
          </Box>
        </Box>
        <SceneContext.Provider value={sceneContext}>
          <LoadingContext>
            <BackstageComponent />
          </LoadingContext>
        </SceneContext.Provider>
      </Box>
    </>
  )
}

const CurrentScreenConnector: ConnectorType<
  {},
  [string, (newScreen: string | null) => Promise<void>]
> = (props) => {
  const dataRef = firebase.database().ref('/currentScreen')
  const dataState = useFirebaseDatabase(dataRef)
  const currentScreen = dataState.unstable_read()
  return (
    <>{props.children(currentScreen, (newScreen) => dataRef.set(newScreen))}</>
  )
}

export function Backstage(props: { scene: IScene }) {
  const BackstageComponent = props.scene.backstageComponent || FallbackBackstage
  const sceneContext = {
    dataRef: firebase.database().ref('/scenes').child(props.scene.name),
  }
  return (
    <Box margin="xsmall" border="all" direction="column">
      <Box
        border="bottom"
        background="dark-1"
        direction="row"
        pad={{ vertical: 'xsmall', horizontal: 'small' }}
      >
        <Box flex>
          <Text weight="bold">{props.scene.name}</Text>
        </Box>
        <Menu
          label="actions"
          items={[
            {
              label: 'Nuke state',
              onClick: () =>
                window.confirm('Are you sure?') &&
                handlePromise(
                  'nuke state',
                  sceneContext.dataRef.remove(),
                  'state cleared'
                ),
            },
          ]}
        />
        <InlineLoadingContext description="get current scene">
          {λ(() => {
            const dataRef = firebase.database().ref('/currentScene')
            // Using hooks in λ is okay but now that `react-script` refuses to compile this, we should use `fiery.Data` instead.
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const dataState = useFirebaseDatabase(dataRef)
            const currentScene = dataState.unstable_read()
            return (
              <ActionCheckbox
                checked={currentScene === props.scene.name}
                description={`set currentScene to "${props.scene.name}"`}
                onChange={() => dataRef.set(props.scene.name)}
                toggle
                label="active"
              />
            )
          })}
        </InlineLoadingContext>
      </Box>
      <SceneContext.Provider value={sceneContext}>
        <LoadingContext>
          <BackstageComponent />
        </LoadingContext>
      </SceneContext.Provider>
    </Box>
  )
}

export function FallbackBackstage() {
  return <Box pad="small">No backstage UI is defined for this scene.</Box>
}
