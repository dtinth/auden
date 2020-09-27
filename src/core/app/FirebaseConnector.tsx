import React, { useMemo } from 'react'
import { ConnectorType } from '../ui'
import firebase from 'firebase'
import { useFirebaseDatabase } from 'fiery'

export const FirebaseDataConnector: ConnectorType<
  { path: string[]; baseRef?: firebase.database.Reference },
  [any, firebase.database.Reference]
> = (props) => {
  const pathJoined = useMemo(() => JSON.stringify(props.path), [props.path])
  const dataRef = useMemo(() => {
    return (JSON.parse(pathJoined) as string[]).reduce(
      (node, next) => node.child(next),
      props.baseRef || firebase.database().ref()
    )
  }, [props.baseRef, pathJoined])
  const data = useFirebaseDatabase(dataRef)
  return <>{props.children(data.unstable_read(), dataRef)}</>
}
