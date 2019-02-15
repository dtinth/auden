import { useFirebaseAuth, useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Box, Grommet, Heading, Paragraph, Text } from 'grommet'
import { dark, generate } from 'grommet/themes'
import { deepMerge } from 'grommet/utils'
import React, { ReactNode, Suspense, useEffect } from 'react'
import λ from 'react-lambda'
import { HashRouter, Route, Switch } from 'react-router-dom'
import { IConfig } from '../model'
import {
  ActionButton,
  ErrorBoundary,
  ErrorMessage,
  InlineLoadingContext,
  Loading,
  handlePromise
} from '../ui'
import { AdminRoot } from './AdminRoot'
import { ConfigContext } from './ConfigContext'
import { AudienceRoot } from './AudienceRoot'
import { DisplayRoot } from './DisplayRoot'

export * from './FirebaseDataUtils'

const theme = deepMerge(generate(24, 6), dark, {
  global: {
    font: {
      family: 'inherit'
    }
  }
})

export function App(props: { config: IConfig }) {
  return (
    <ConfigContext.Provider value={props.config}>
      <Grommet theme={theme} full>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <AuthenticationWall>
              {user => <ProtectedArea user={user} />}
            </AuthenticationWall>
          </Suspense>
        </ErrorBoundary>
      </Grommet>
    </ConfigContext.Provider>
  )
}

function ProtectedArea(props: { user: firebase.User }) {
  const { user } = props
  return (
    <React.Fragment>
      <TopBar user={user} />
      <Suspense fallback={<Loading />}>
        <Main user={user} />
      </Suspense>
    </React.Fragment>
  )
}

function TopBar(props: { user: firebase.User }) {
  const { user } = props
  return (
    <Box pad="small" direction="row" border="bottom" align="center">
      <Text>
        Hi, <strong>{String(user.displayName).split(/\s+/)[0]}</strong>!
        <span style={{ fontSize: '0.75em' }}>
          {' '}
          <InlineLoadingContext description="check admin status">
            {λ(() => {
              const adminState = useFirebaseDatabase(
                firebase
                  .database()
                  .ref('/admins')
                  .child(user.uid)
              )
              return <span>{adminState.unstable_read() ? '(admin)' : ''}</span>
            })}
          </InlineLoadingContext>
        </span>
      </Text>
      <Text margin={{ left: 'auto' }}>
        <ActionButton
          plain
          label="Sign out"
          color="neutral-3"
          onClick={async () => {
            if (confirm('Surely?')) await firebase.auth().signOut()
          }}
        />
      </Text>
    </Box>
  )
}

function Main(props: { user: firebase.User }) {
  return (
    <HashRouter>
      <Switch>
        <Route exact path="/" component={AudienceRoot} />
        <Route exact path="/display" component={DisplayRoot} />
        <Route
          exact
          path="/admin"
          render={props => <AdminRoot history={props.history} />}
        />
        <Route
          exact
          path="/admin/:scene"
          render={props => (
            <AdminRoot
              sceneName={props.match.params.scene}
              history={props.history}
            />
          )}
        />
        <Route component={NoMatch} />
      </Switch>
    </HashRouter>
  )
}

function NoMatch() {
  return <ErrorMessage message="Route not matched T_T" />
}

function AuthenticationWall(props: {
  children: (user: firebase.User) => ReactNode
}) {
  const authState = useFirebaseAuth()
  const me = authState.unstable_read()
  return (
    <React.Fragment>
      {me ? (
        λ(() => {
          const profileRef = firebase
            .database()
            .ref('/profiles')
            .child(me.uid)
          const profileState = useFirebaseDatabase(profileRef)
          const profile = profileState.unstable_read()
          useEffect(() => {
            if (!profile) {
              handlePromise(
                'create profile',
                profileRef.set({
                  displayName: me.displayName
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

export function UserName(props: { uid: string }) {
  const profileState = useFirebaseDatabase(
    firebase
      .database()
      .ref('profiles')
      .child(props.uid)
      .child('displayName')
  )
  return <span>{profileState.unstable_read() || props.uid}</span>
}
