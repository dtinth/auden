import React from 'react'
import { useConfig } from './ConfigContext'
import { Tabs, Tab, Box, Text, CheckBox, Menu } from 'grommet'
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
  ActionCheckbox
} from '../ui'
import { SceneContext } from './SceneContext'

export function AdminRoot(props: { sceneName?: string; history: History }) {
  const config = useConfig()
  return (
    <div>
      <Tabs
        activeIndex={
          config.scenes.findIndex(s => s.name === props.sceneName!) + 1
        }
        onActive={index => {
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

export function Backstage(props: { scene: IScene }) {
  const BackstageComponent = props.scene.backstageComponent || FallbackBackstage
  const sceneContext = {
    dataRef: firebase
      .database()
      .ref('/scenes')
      .child(props.scene.name)
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
                )
            }
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
