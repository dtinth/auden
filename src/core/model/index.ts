import { ComponentType } from 'react'

export interface IScene {
  name: string
  presentationComponent?: ComponentType<{}>
  audienceComponent?: ComponentType<{}>
  backstageComponent?: ComponentType<{}>
}

export interface IConfig {
  firebase: any
  scenes: IScene[]
}

export interface ISceneContext {
  dataRef: firebase.database.Reference
}
