import React, { useMemo } from 'react'
import { ConnectorType } from '../ui'
import firebase from 'firebase'
import { useFirebaseDatabase } from 'fiery'

export const FirebaseDataConnector: ConnectorType<
  { path: string[]; baseRef?: firebase.database.Reference },
  [FirebaseData]
> = (props) => {
  const pathJoined = useMemo(() => JSON.stringify(props.path), [props.path])
  const dataRef = useMemo(() => {
    return (JSON.parse(pathJoined) as string[]).reduce(
      (node, next) => node.child(next),
      props.baseRef || firebase.database().ref()
    )
  }, [props.baseRef, pathJoined])
  const data = useFirebaseDatabase(dataRef)
  const value = data.unstable_read()
  const firebaseData: FirebaseData = useMemo(() => ({ value, ref: dataRef }), [
    value,
    dataRef,
  ])
  return <>{props.children(firebaseData)}</>
}

export interface FirebaseData {
  value: any
  ref: firebase.database.Reference
}
