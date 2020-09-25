import { useFirebaseAuth, useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Box, Heading, Paragraph } from 'grommet'
import React, { ReactNode, useEffect } from 'react'
import λ from 'react-lambda'
import { ActionButton, Loading, handlePromise } from '../ui'

export function AuthenticationWall(props: {
  children: (user: firebase.User) => ReactNode
}) {
  const authState = useFirebaseAuth()
  const me = authState.unstable_read()
  return (
    <React.Fragment>
      {me ? (
        λ(() => {
          const profileRef = firebase.database().ref('/profiles').child(me.uid)
          // Using hooks in λ is okay but now that `react-script` refuses to compile this, we should use `fiery.Data` instead.
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const profileState = useFirebaseDatabase(profileRef)
          const profile = profileState.unstable_read()

          // Using hooks in λ is okay but now that `react-script` refuses to compile this, we should convert this to actual React.FC instead.
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (!profile) {
              handlePromise(
                'create profile',
                profileRef.set({
                  displayName: me.displayName,
                }),
                'User profile created.'
              )
            }
          }, [profile])
          return profile ? (
            <React.Fragment>{props.children(me)}</React.Fragment>
          ) : (
            <Loading message="Creating profile..." />
          )
        })
      ) : (
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
        </Box>
      )}
    </React.Fragment>
  )
}
