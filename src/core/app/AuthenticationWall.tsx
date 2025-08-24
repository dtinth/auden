import { useFirebaseAuth, useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import {
  Box,
  CheckBox,
  Heading,
  Paragraph,
  Text,
  TextArea,
  TextInput,
} from 'grommet'
import React, { ReactNode, useEffect, useState } from 'react'
import { ActionButton, ConnectorType, Loading, handlePromise } from '../ui'
import { signInIntegrationCallbacks } from './SignInIntegrationCallbacks'

export function AuthenticationWall(props: {
  children: (user: firebase.User) => ReactNode
}) {
  const authState = useFirebaseAuth()
  const me = authState.unstable_read()
  return (
    <React.Fragment>
      {me ? (
        <ProfileConnector
          uid={me.uid}
          displayName={me.displayName}
          getFallbackDisplayName={async () =>
            (await me.getIdTokenResult()).claims.name || me.uid
          }
        >
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
  const [needsWaiting, setNeedsWaiting] = useState(
    signInIntegrationCallbacks.length > 0
  )
  const [showEmulatorConfig, setShowEmulatorConfig] = useState(false)
  const [customToken, setCustomToken] = useState('')

  const isEmulatorMode =
    localStorage.getItem('USE_FIREBASE_EMULATOR') === 'true'

  useEffect(() => {
    async function runCallbacks() {
      try {
        for (const callback of signInIntegrationCallbacks) {
          await handlePromise('complete sign in', callback(), 'Signed in')
        }
      } finally {
        setNeedsWaiting(false)
      }
    }
    runCallbacks()
  }, [])

  const handleSignInWithCustomToken = async () => {
    try {
      await handlePromise(
        'sign in with custom token',
        firebase.auth().signInWithCustomToken(customToken),
        'Signed in with custom token'
      )
    } catch (error) {
      alert('Failed to sign in with custom token: ' + String(error))
    }
  }

  if (needsWaiting) {
    return <Loading message="Signing in..." />
  }
  return (
    <Box pad="medium" gap="medium">
      <Heading level="1">Welcome</Heading>

      <Paragraph>
        Please sign in to participate in our event's activities!
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
                `eventId=26957`,
                `target=${encodeURIComponent(window.location.host)}`,
                `hash=${encodeURIComponent(window.location.hash)}`,
              ].join('&')
          }}
        />
      </Paragraph>

      {isEmulatorMode && (
        <Box gap="small" border="top" pad={{ top: 'medium' }}>
          <Paragraph color="status-warning">
            🧪 <strong>Emulator Mode Active</strong>
          </Paragraph>
          <TextArea
            placeholder="Paste custom JWT token here..."
            value={customToken}
            onChange={(event) => setCustomToken(event.target.value)}
            rows={3}
          />
          <ActionButton
            label="Sign in with Custom Token"
            onClick={handleSignInWithCustomToken}
            disabled={!customToken.trim()}
          />
        </Box>
      )}

      {window.location.hostname.includes('localhost') && (
        <Box gap="small" border="top" pad={{ top: 'medium' }}>
          <ActionButton
            plain
            label={
              showEmulatorConfig ? 'Hide Testing Config' : 'Show Testing Config'
            }
            onClick={() => setShowEmulatorConfig(!showEmulatorConfig)}
          />
          {showEmulatorConfig && <EmulatorConfig />}
        </Box>
      )}
    </Box>
  )
}

const ProfileConnector: ConnectorType<
  {
    uid: string
    displayName: string | null
    getFallbackDisplayName: () => Promise<string>
  },
  [any]
> = (props) => {
  const { displayName, getFallbackDisplayName } = props
  const profileRef = firebase.database().ref('/profiles').child(props.uid)
  const profileState = useFirebaseDatabase(profileRef)
  const profile = profileState.unstable_read()
  useEffect(() => {
    if (!profile) {
      handlePromise(
        'create profile',
        Promise.resolve(
          displayName || getFallbackDisplayName()
        ).then(async (displayName) => {
          await firebase.auth().currentUser?.updateProfile({ displayName })
          return profileRef.set({ displayName })
        }),
        'User profile created.'
      )
    }
  }, [profile])
  return <>{props.children(profile)}</>
}

function EmulatorConfig() {
  const [emulatorEnabled, setEmulatorEnabled] = useState(
    localStorage.getItem('USE_FIREBASE_EMULATOR') === 'true'
  )
  const [dbNamespace, setDbNamespace] = useState(
    localStorage.getItem('FIREBASE_DB_NAMESPACE') || ''
  )

  const handleApplySettings = () => {
    if (emulatorEnabled) {
      localStorage.setItem('USE_FIREBASE_EMULATOR', 'true')

      const namespace = dbNamespace || `test-${Date.now()}`
      localStorage.setItem('FIREBASE_DB_NAMESPACE', namespace)
      setDbNamespace(namespace)
    } else {
      localStorage.removeItem('USE_FIREBASE_EMULATOR')
      localStorage.removeItem('FIREBASE_DB_NAMESPACE')
    }

    // Reload the app to apply emulator settings
    window.location.reload()
  }

  const currentEmulatorStatus =
    localStorage.getItem('USE_FIREBASE_EMULATOR') === 'true'

  return (
    <Box gap="small" background="light-2" pad="small" round="small">
      <Text weight="bold" size="small">
        🧪 Firebase Emulator Configuration
      </Text>

      <Text size="small">
        Current: {currentEmulatorStatus ? 'ON' : 'OFF'}
        {currentEmulatorStatus &&
          ` (${localStorage.getItem('FIREBASE_DB_NAMESPACE')})`}
      </Text>

      <CheckBox
        checked={emulatorEnabled}
        label="Enable Firebase Emulator Mode"
        onChange={(event) => setEmulatorEnabled(event.target.checked)}
      />

      {emulatorEnabled && (
        <Box gap="small">
          <Text size="small">Database Namespace:</Text>
          <TextInput
            size="small"
            value={dbNamespace}
            onChange={(event) => setDbNamespace(event.target.value)}
            placeholder={`test-${Date.now()}`}
          />
        </Box>
      )}

      <ActionButton
        size="small"
        label="Apply & Reload"
        onClick={handleApplySettings}
      />
    </Box>
  )
}
