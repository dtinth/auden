import { createContext, useContext } from 'react'
import { ISceneContext } from '../model'

export const SceneContext = createContext<ISceneContext | null>(null)

export function useSceneContext() {
  const sceneContext = useContext(SceneContext)
  if (!sceneContext) throw new Error('No scene context passed T_T')
  return sceneContext
}
