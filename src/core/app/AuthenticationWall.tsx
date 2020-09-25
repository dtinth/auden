import { useFirebaseAuth, useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Box, Heading, Paragraph } from 'grommet'
import React, { ReactNode, useEffect } from 'react'
import { ActionButton, Loading, handlePromise, ConnectorType } from '../ui'

export function AuthenticationWall(props: {
  children: (user: firebase.User) => ReactNode
}) {
  const authState = useFirebaseAuth()
  const me = authState.unstable_read()
  return (
    <React.Fragment>
      {me ? (
        <ProfileConnector uid={me.uid} displayName={me.displayName || me.uid}>
          {(profile) => {
            return profile ? (
              <React.Fragment>{props.children(me)}</React.Fragment>
            ) : (
              <Loading message="Creating profile..." />
            )
          }}
        </ProfileConnector>
      ) : (
        <PleaseSignIn />
      )}
    </React.Fragment>
  )
}

function PleaseSignIn() {
  return (
    <Box pad="medium">
      <Heading level="1">You must sign in to continue</Heading>
      <Paragraph>
        <ActionButton
          primary
          label="Sign in with Facebook"
          color="#365899"
          onClick={() =>
            firebase
              .auth()
              .signInWithPopup(new firebase.auth.FacebookAuthProvider())
          }
        />
      </Paragraph>
      <Paragraph>
        <ActionButton
          primary
          label="Sign in with Eventpop"
          color="#2e018f"
          onClick={() => {
            window.location.href =
              'https://eventpop-ticket-gateway.vercel.app/redirect.html?' +
              [
                `eventId=9622`,
                `target=${encodeURIComponent(window.location.host)}`,
                `hash=${encodeURIComponent(window.location.hash)}`,
              ].join('&')
          }}
        />
      </Paragraph>
    </Box>
  )
}

const ProfileConnector: ConnectorType<
  { uid: string; displayName: string },
  [any]
> = (props) => {
  const profileRef = firebase.database().ref('/profiles').child(props.uid)
  const profileState = useFirebaseDatabase(profileRef)
  const profile = profileState.unstable_read()
  useEffect(() => {
    if (!profile) {
      handlePromise(
        'create profile',
        profileRef.set({
          displayName: props.displayName,
        }),
        'User profile created.'
      )
    }
  }, [profile])
  return <>{props.children(profile)}</>
}
