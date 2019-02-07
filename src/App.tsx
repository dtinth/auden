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
import { useFirebaseAuth, useFirebaseDatabase, Data } from 'fiery'
import firebase from 'firebase'

const theme = deepMerge(generate(24, 6), dark, {
  global: {
    font: {
      family: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`
    }
  }
})

function App() {
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

function InlineLoadingContext({ children }: { children: ReactNode }) {
  return (
    <InlineErrorBoundary>
      <Suspense fallback={'...'}>{children}</Suspense>
    </InlineErrorBoundary>
  )
}

function TopBar(props: { user: firebase.User }) {
  const { user } = props
  return (
    <Box pad="small" direction="row" border="bottom" align="center">
      <Text>
        Hi, <strong>{String(user.displayName).split(/\s+/)[0]}</strong>!
        <small>
          {' '}
          <InlineLoadingContext>
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
  return <div>Hey!</div>
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

class ErrorBoundary extends React.Component<{}, { error?: Error }> {
  constructor(props: {}) {
    super(props)
    this.state = {}
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <Box background="status-error" pad="medium">
          <Heading level="1" margin={{ top: 'none', bottom: 'small' }}>
            Error :(
          </Heading>
          <Text size="large">{String(this.state.error)}</Text>
        </Box>
      )
    }
    return this.props.children
  }
}

class InlineErrorBoundary extends React.Component<{}, { error?: Error }> {
  constructor(props: {}) {
    super(props)
    this.state = {}
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <Text color="status-error">
          <Button
            plain
            label=":("
            onClick={() => window.alert(this.state.error)}
          />
        </Text>
      )
    }
    return this.props.children
  }
}

export default App
