import { useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import React from 'react'
import { ConnectorType } from '../ui'

export const CurrentScreenConnector: ConnectorType<
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
