import { useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Anchor, Box, Button, Heading, Menu, Nav } from 'grommet'
import { Add, Inspect } from 'grommet-icons'
import { History } from 'history'
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  const screenId = props.screenId
  const [previewEnabled, setPreviewEnabled] = useState(false)
  const navigation = useMemo(
    () => (
      <Box width="16rem">
        <AdminNavigation />
      </Box>
    ),
    []
  )
  const mainArea = useMemo(
    () => (
      <Box flex>
        {screenId ? (
          <LoadingContext>
            <ScreenBackstage key={screenId} screenId={screenId} />
          </LoadingContext>
        ) : (
          <AdminEmptyState />
        )}
      </Box>
    ),
    [screenId]
  )
  const previewSidebar = useMemo(
    () => (
      <Box width={previewEnabled ? '24rem' : ''} gap="small">
        <Box align="end">
          <Nav gap="small">
            <Button
              icon={<Inspect />}
              hoverIndicator
              onClick={() => setPreviewEnabled((x) => !x)}
            />
          </Nav>
        </Box>
        <Box style={{ position: 'sticky', top: '1rem' }}>
          {previewEnabled ? <AdminPreviewer screenId={screenId} /> : null}
        </Box>
      </Box>
    ),
    [previewEnabled, screenId]
  )
  return (
    <Box direction="row" gap="medium" pad="small">
      {navigation}
      {mainArea}
      {previewSidebar}
    </Box>
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
                <Anchor href={`#/admin/screens/${screenId}`}>
                  <Box pad="small">
                    <InlineLoadingContext description={'get screen title'}>
                      <ScreenInfoConnector key={screenId} screenId={screenId}>
                        {(info) =>
                          info ? (
                            <>
                              <CurrentScreenConnector>
                                {(currentScreen) =>
                                  screenId === currentScreen ? '>>> ' : ''
                                }
                              </CurrentScreenConnector>
                              {info.title}
                            </>
                          ) : null
                        }
                      </ScreenInfoConnector>
                    </InlineLoadingContext>
                  </Box>
                </Anchor>
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

function AdminPreviewer(props: { screenId?: string }) {
  const { screenId } = props
  const previewFrame = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    const frame = previewFrame.current
    if (frame) {
      const container = frame.parentNode as HTMLDivElement
      if (container.offsetWidth) {
        frame.style.transform = 'scale(' + container.offsetWidth / 1280 + ')'
        frame.style.transformOrigin = 'top left'
      }
    }
  }, [])
  return (
    <Box gap="medium">
      <Panel title="Display">
        <div
          style={{
            position: 'relative',
            paddingTop: '56.25%',
            overflow: 'hidden',
          }}
        >
          <iframe
            ref={previewFrame}
            src={screenId ? '/#/display/' + screenId : '/#/display'}
            style={{
              width: '1280px',
              border: '0',
              height: '720px',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          ></iframe>
        </div>
      </Panel>
      <Panel title="Audience">
        <iframe
          src={screenId ? '/#/audience/' + screenId : '/#/'}
          style={{ width: '100%', border: '0', height: '480px' }}
        ></iframe>
      </Panel>
    </Box>
  )
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
