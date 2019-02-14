import React from 'react'
import { useConfig } from './ConfigContext'
import { Tabs, Tab } from 'grommet'
import λ from 'react-lambda'
import { IScene } from '../model'
export function AdminRoot(props: { scene?: string }) {
  const config = useConfig()
  return (
    <div>
      <Tabs>
        {config.scenes.map((scene, i) => (
          <Tab title={scene.name} key={i}>
            <Backstage scene={scene} />
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}

export function Backstage(props: { scene: IScene }) {
  const BackstageComponent = props.scene.backstageComponent || FallbackBackstage
  return (
    <div>
      {props.scene.name}
      <BackstageComponent />
    </div>
  )
}

export function FallbackBackstage() {
  return <div>No backstage UI is defined for this scene.</div>
}
