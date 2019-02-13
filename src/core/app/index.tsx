import React, { useState, Suspense, ReactNode, useCallback } from 'react'
import {
  Grommet,
  Text,
  Box,
  Button,
  Heading,
  Paragraph,
  Layer,
  ButtonProps
} from 'grommet'
import { dark, generate } from 'grommet/themes'
import { deepMerge } from 'grommet/utils'
import { useFirebaseAuth, useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { ErrorBoundary, InlineLoadingContext, ErrorMessage } from '../ui'
import { HashRouter, Route, Switch } from 'react-router-dom'

const theme = deepMerge(generate(24, 6), dark, {
  global: {
    font: {
      family: 'inherit'
    }
  }
})

export function App() {
  return (
    <Grommet theme={theme} full>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <AuthenticationWall>
            {user => <ProtectedArea user={user} />}
          </AuthenticationWall>
        </Suspense>
      </ErrorBoundary>
    </Grommet>
  )
}

function Loading() {
  return (
    <Layer modal={false} responsive={false}>
      <Text size="xxlarge" color="light-6">
        Loading...
      </Text>
    </Layer>
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

function Λ(props: { f: () => JSX.Element | null }) {
  return props.f()
}

function λ(f: () => JSX.Element | null) {
  return <Λ f={f} />
}

function TopBar(props: { user: firebase.User }) {
  const { user } = props
  return (
    <Box pad="small" direction="row" border="bottom" align="center">
      <Text>
        Hi, <strong>{String(user.displayName).split(/\s+/)[0]}</strong>!
        <small>
          {' '}
          <InlineLoadingContext description="check admin status">
            {λ(() => {
              const adminState = useFirebaseDatabase(
                firebase
                  .database()
                  .ref('/admins')
                  .child(user.uid)
              )
              return adminState.unstable_read() ? <small> (admin)</small> : null
            })}
          </InlineLoadingContext>
        </small>
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
        <Route exact path="/admin" render={() => <AdminRoot />} />
        <Route
          exact
          path="/admin/:scene"
          render={props => <AdminRoot scene={props.match.params.scene} />}
        />
        <Route component={NoMatch} />
      </Switch>
    </HashRouter>
  )
}

function AudienceRoot() {
  return <div>Audience view</div>
}

function DisplayRoot() {
  return <div>Display view</div>
}

function AdminRoot(props: { scene?: string }) {
  return <div>Admin view</div>
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
        props.children(me)
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

function ActionButton(props: ButtonProps & JSX.IntrinsicElements['button']) {
  const [running, setRunning] = useState(false)
  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    setRunning(true)
    try {
      if (props.onClick) await props.onClick(e)
    } catch (e) {
      window.alert(`Error: ${e}`)
    } finally {
      setRunning(false)
    }
  }
  return (
    <Button {...props} onClick={onClick} disabled={props.disabled || running} />
  )
}
