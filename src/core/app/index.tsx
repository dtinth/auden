import { useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Box, Grommet, Text } from 'grommet'
import { dark, generate } from 'grommet/themes'
import { deepMerge } from 'grommet/utils'
import React, { Suspense } from 'react'
import λ from 'react-lambda'
import { HashRouter, Route, Switch } from 'react-router-dom'
import { IConfig } from '../model'
import {
  ActionButton,
  ErrorBoundary,
  ErrorMessage,
  InlineLoadingContext,
  Loading,
} from '../ui'
import { AdminRoot } from './AdminRoot'
import { ConfigContext } from './ConfigContext'
import { AudienceRoot } from './AudienceRoot'
import { DisplayRoot } from './DisplayRoot'
import { AuthenticationWall } from './AuthenticationWall'

export * from './FirebaseDataUtils'
export * from './FirebaseConnector'

const theme = deepMerge(generate(24, 6), dark, {
  global: {
    focus: {
      shadow: '0 0 0 2px #888',
    },
    font: {
      family: 'inherit',
    },
  },
})

export function App(props: { config: IConfig }) {
  return (
    <ConfigContext.Provider value={props.config}>
      <Grommet theme={theme} full>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <AuthenticationWall>
              {(user) => <ProtectedArea user={user} />}
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
              // Using hooks in λ is okay but now that `react-script` refuses to compile this, we should use `fiery.Data` instead.
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const adminState = useFirebaseDatabase(
                firebase.database().ref('/admins').child(user.uid)
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
            if (window.confirm('Surely?')) await firebase.auth().signOut()
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
        <Route exact path="/audience/:forceScreenId" component={AudienceRoot} />
        <Route exact path="/display" component={DisplayRoot} />
        <Route exact path="/display/:forceScreenId" component={DisplayRoot} />
        <Route
          exact
          path="/admin"
          render={(props) => <AdminRoot history={props.history} />}
        />
        <Route
          exact
          path="/admin/screens/:screenId"
          render={(props) => (
            <AdminRoot
              history={props.history}
              screenId={props.match.params.screenId}
            />
          )}
        />
        <Route
          exact
          path="/admin/:scene"
          render={(props) => (
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

export const UserName = React.memo((props: { uid: string }) => {
  const profileState = useFirebaseDatabase(
    firebase.database().ref('profiles').child(props.uid).child('displayName')
  )
  return <span>{profileState.unstable_read() || props.uid}</span>
})
