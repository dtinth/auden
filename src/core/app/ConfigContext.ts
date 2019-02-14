import { createContext, useContext } from 'react'
import { IConfig } from '../model'

export const ConfigContext = createContext<IConfig | null>(null)

export function useConfig() {
  const config = useContext(ConfigContext)
  if (!config) throw new Error('No config context passed T_T')
  return config
}
