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

export function ChatView() {
  return (
    <div
      className="ChatView"
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
              {events.map((m) => (
                <ChatMessageView key={m.key} chatMessage={m} />
              ))}
            </ChatScroller>
          )}
        </ChatEventsConnector>
      </LoadingContext>
    </div>
  )
}

const ChatMessageView = React.memo(function ChatMessageView(props: {
  chatMessage: ChatMessage
}) {
  const { key, val } = props.chatMessage
  return (
    <div
      key={key}
      style={{ padding: '0.5ex 0', lineHeight: '1.32' }}
      className="ChatView__item"
    >
      <strong style={{ color: getUserColor(val.owner) }}>
        <UserName uid={val.owner} />:{' '}
      </strong>
      {String(val.payload?.text).slice(0, 280)}
    </div>
  )
})

function ChatScroller(props: { children: ReactNode; latestKey?: string }) {
  const divRef = useRef<HTMLDivElement>(null)
  const [autoScrolling, setAutoScrolling] = useState(true)
  const autoScrollingRef = useRef(autoScrolling)
  const scrollingAnimationActiveRef = useRef(false)

  useEffect(() => {
    autoScrollingRef.current = autoScrolling
  }, [autoScrolling])

  useEffect(() => {
    void props.latestKey
    if (autoScrollingRef.current) {
      const div = divRef.current
      if (div) {
        beginScrollingAnimation(div)
      }
    }

    function beginScrollingAnimation(div: HTMLDivElement) {
      if (scrollingAnimationActiveRef.current) {
        return
      }
      scrollingAnimationActiveRef.current = true
      let lastTime = Date.now()
      const frame = () => {
        const now = Date.now()
        const elapsed = (now - lastTime) / 1e3
        const pullDistance = div.scrollHeight - div.scrollTop
        const remainingDistance = pullDistance * Math.exp(-elapsed)
        const dy = Math.ceil(Math.max(0, pullDistance - remainingDistance))
        const before = div.scrollTop
        div.scrollTop += dy
        const after = div.scrollTop
        if (before !== after) {
          lastTime = now
          requestAnimationFrame(frame)
        } else {
          scrollingAnimationActiveRef.current = false
        }
      }
      requestAnimationFrame(frame)
    }
  }, [props.latestKey])

  const checkScroll = useCallback(() => {
    const div = divRef.current
    if (!div) return
    if (div.scrollTop + div.offsetHeight >= div.scrollHeight - 10) {
      setAutoScrolling(true)
    } else if (!scrollingAnimationActiveRef.current) {
      setAutoScrolling(false)
    }
  }, [])

  return (
    <>
      <div
        className="ChatScroller"
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
  }, [dataRef])
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
