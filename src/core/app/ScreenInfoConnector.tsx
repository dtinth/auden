import { useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import React, { useCallback } from 'react'
import { ConnectorType } from '../ui'

export const ScreenInfoConnector: ConnectorType<
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
