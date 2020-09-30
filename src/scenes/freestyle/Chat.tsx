import { useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Box, Button, Text, TextArea } from 'grommet'
import { Send } from 'grommet-icons'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { firebaseToEntries, UserName } from '../../core/app'
import { useSceneContext } from '../../core/app/SceneContext'
import { ConnectorType, LoadingContext } from '../../core/ui'
import { getUserColor } from './UserColor'

export function ChatAudience() {
  const div = useRef<HTMLDivElement>(null)
  const [measuredHeight, setMeasuredHeight] = useState('300px')
  useEffect(() => {
    if (!div.current) {
      return
    }
    const updateHeight = () => {
      let offsetTop = 0
      for (
        let c: HTMLElement | null = div.current;
        c;
        c = c.offsetParent as HTMLElement | null
      ) {
        if (c.offsetTop) {
          offsetTop += c.offsetTop
        }
      }
      if (offsetTop === 0) {
        requestAnimationFrame(() => {
          updateHeight()
        })
      } else {
        setMeasuredHeight(window.innerHeight - offsetTop - 10 + 'px')
      }
    }
    requestAnimationFrame(() => {
      updateHeight()
    })
  }, [])
  return (
    <Box height={measuredHeight} ref={div}>
      <Box flex style={{ position: 'relative' }}>
        <ChatView />
      </Box>
      <Box>
        <ChatSubmitter />
      </Box>
    </Box>
  )
}

function ChatView() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <LoadingContext>
        <ChatEventsConnector>
          {(events) => (
            <ChatScroller latestKey={events[events.length - 1]?.key}>
              {events.map(({ key, val }) => {
                return (
                  <div key={key} style={{ padding: '0.5ex 0' }}>
                    <strong style={{ color: getUserColor(val.owner) }}>
                      <UserName uid={val.owner} />:{' '}
                    </strong>
                    {String(val.payload?.text).slice(0, 280)}
                  </div>
                )
              })}
            </ChatScroller>
          )}
        </ChatEventsConnector>
      </LoadingContext>
    </div>
  )
}

function ChatScroller(props: { children: ReactNode; latestKey?: string }) {
  const divRef = useRef<HTMLDivElement>(null)
  const [autoScrolling, setAutoScrolling] = useState(true)
  const autoScrollingRef = useRef(autoScrolling)

  useEffect(() => {
    autoScrollingRef.current = autoScrolling
  }, [autoScrolling])

  useEffect(() => {
    void props.latestKey
    if (autoScrollingRef.current) {
      const div = divRef.current
      if (div) {
        div.scrollTop = div.scrollHeight
      }
    }
  }, [props.latestKey])

  const checkScroll = useCallback(() => {
    const div = divRef.current
    if (!div) return
    if (div.scrollTop + div.offsetHeight >= div.scrollHeight - 10) {
      setAutoScrolling(true)
    } else {
      setAutoScrolling(false)
    }
  }, [])

  return (
    <>
      <div
        ref={divRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          overflowY: 'scroll',
        }}
        onScroll={checkScroll}
      >
        {props.children}
      </div>
      {!autoScrolling && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <Box background="neutral-3" pad="xsmall">
            <Text color="white">Viewing older messages</Text>
          </Box>
        </div>
      )}
    </>
  )
}

function ChatSubmitter() {
  const { dataRef } = useSceneContext()
  const textarea = useRef<HTMLTextAreaElement>(null)
  const send = useCallback(() => {
    dataRef
      .child('main')
      .child('chat')
      .child('events')
      .push({
        owner: firebase.auth().currentUser!.uid,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        payload: {
          text: textarea.current!.value,
        },
      })
    textarea.current!.value = ''
  }, [])
  return (
    <Box direction="row">
      <TextArea
        ref={textarea}
        onInput={() => {
          const t = textarea.current!
          if (t.value.length > 280) {
            t.value = t.value.slice(0, 280)
          }
        }}
      />
      <Button icon={<Send />} onClick={send} />
    </Box>
  )
}

type ChatMessage = {
  key: string
  val: any
}

const ChatEventsConnector: ConnectorType<{}, [ChatMessage[]]> = (props) => {
  const { dataRef } = useSceneContext()
  const chatEventsRef = useMemo(
    () =>
      dataRef
        .child('main')
        .child('chat')
        .child('events')
        .orderByChild('timestamp')
        .limitToLast(30),
    [dataRef]
  )
  const chatEventsState = useFirebaseDatabase(chatEventsRef)
  const events = chatEventsState.unstable_read()
  return <>{props.children(firebaseToEntries(events))}</>
}
