import { useFirebaseDatabase } from 'fiery'
import firebase from 'firebase'
import { Box, Button, Tab, Tabs, Text, TextArea } from 'grommet'
import { Send, Upgrade } from 'grommet-icons'
import React, { useCallback, useMemo, useRef } from 'react'
import { firebaseToEntries, UserName } from '../../core/app'
import { useSceneContext } from '../../core/app/SceneContext'
import { ConnectorType, LoadingContext } from '../../core/ui'
import { getUserColor } from './UserColor'

export function QuestionAudience() {
  return (
    <Box gap="small">
      <Box>
        <QuestionSubmitter />
      </Box>
      <Box>
        <Tabs>
          <Tab title="Top Questions">
            <QuestionView sort="top" />
          </Tab>
          <Tab title="Latest">
            <QuestionView />
          </Tab>
        </Tabs>
      </Box>
    </Box>
  )
}

export function QuestionView(props: { sort?: 'top' | 'latest' }) {
  return (
    <Box className="QuestionView">
      <LoadingContext>
        <QuestionsConnector>
          {(questions) => {
            if (props.sort === 'top') {
              questions = questions.slice().sort((a, z) => z.likes - a.likes)
            }
            return (
              <Box gap="small">
                {questions.map((question) => (
                  <QuestionItem key={question.eventKey} question={question} />
                ))}
              </Box>
            )
          }}
        </QuestionsConnector>
      </LoadingContext>
    </Box>
  )
}

const QuestionItem = React.memo(function QuestionItem(props: {
  question: Question
}) {
  const { question } = props
  const { dataRef } = useSceneContext()
  const eventKey = question.eventKey
  const setLike = useCallback(
    (value: null | true) => {
      return dataRef
        .child('main')
        .child('questions')
        .child('personal')
        .child(firebase.auth().currentUser!.uid)
        .child('likes')
        .child(eventKey)
        .set(value)
    },
    [dataRef, eventKey]
  )
  const onLike = useCallback(() => setLike(true), [setLike])
  const onUnlike = useCallback(() => setLike(null), [setLike])
  const likeButton = useMemo(
    () => (
      <LikeButton
        likes={question.likes}
        liked={question.liked}
        onLike={onLike}
        onUnlike={onUnlike}
      />
    ),
    [question.likes, question.liked, onLike, onUnlike]
  )
  const questionBody = useMemo(
    () => (
      <>
        <strong style={{ color: getUserColor(question.owner) }}>
          <UserName uid={question.owner} />:{' '}
        </strong>
        {question.text}
      </>
    ),
    [question.owner, question.text]
  )
  return useMemo(
    () => (
      <Box
        id={`question-${eventKey}`}
        border
        round
        pad="small"
        className="QuestionView__item"
        direction="row"
        gap="small"
      >
        <Box alignSelf="center">{likeButton}</Box>
        <Box flex>{questionBody}</Box>
      </Box>
    ),
    [eventKey, likeButton, questionBody]
  )
})

function LikeButton(props: {
  likes: number
  liked: boolean
  onLike: () => void
  onUnlike: () => void
}) {
  return (
    <Box>
      <Button
        icon={<Upgrade color={props.liked ? 'status-ok' : undefined} />}
        plain
        style={{ padding: '0.5ex' }}
        onClick={props.liked ? props.onUnlike : props.onLike}
      />
      <Text
        textAlign="center"
        size="small"
        style={{ pointerEvents: 'none', marginTop: '-0.5ex' }}
      >
        {props.likes}
      </Text>
    </Box>
  )
}

function QuestionSubmitter() {
  const { dataRef } = useSceneContext()
  const textarea = useRef<HTMLTextAreaElement>(null)
  const uid = firebase.auth().currentUser!.uid
  const send = useCallback(() => {
    const questionRef = dataRef
      .child('main')
      .child('questions')
      .child('personal')
      .child(uid)
      .child('questions')
      .push({
        text: textarea.current!.value,
        owner: firebase.auth().currentUser!.uid,
      })
    const eventRef = dataRef
      .child('main')
      .child('questions')
      .child('events')
      .push({
        owner: firebase.auth().currentUser!.uid,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        payload: {
          questionKey: questionRef.key,
        },
      })
    dataRef
      .child('main')
      .child('questions')
      .child('personal')
      .child(uid)
      .child('likes')
      .child(eventRef.key!)
      .set(true)
    textarea.current!.value = ''
  }, [dataRef])
  return (
    <Box direction="row">
      <TextArea
        placeholder="Ask a question (max 500 chars)"
        ref={textarea}
        onInput={() => {
          const t = textarea.current!
          if (t.value.length > 500) {
            t.value = t.value.slice(0, 500)
          }
        }}
      />
      <Button icon={<Send />} onClick={send} />
    </Box>
  )
}

type Question = {
  eventKey: string
  questionKey: string
  owner: string
  text: string
  likes: number
  liked: boolean
}

const QuestionsConnector: ConnectorType<{}, [Question[]]> = (props) => {
  const { dataRef } = useSceneContext()
  const questionEventsRef = useMemo(
    () =>
      dataRef
        .child('main')
        .child('questions')
        .child('events')
        .orderByChild('timestamp'),
    [dataRef]
  )
  const questionDataRef = useMemo(
    () => dataRef.child('main').child('questions').child('personal'),
    [dataRef]
  )
  const questionEventsState = useFirebaseDatabase(questionEventsRef)
  const questionDataState = useFirebaseDatabase(questionDataRef)
  const events = questionEventsState.unstable_read()
  const data = questionDataState.unstable_read()
  const uid = firebase.auth().currentUser?.uid

  const likesByEventKey: { [k: string]: number } = {}
  const likedByEventKey: { [k: string]: boolean } = {}

  for (const { key: owner, val } of firebaseToEntries(data)) {
    for (const likedEventKey of Object.keys(val?.likes || {})) {
      likesByEventKey[likedEventKey] = (likesByEventKey[likedEventKey] || 0) + 1
      if (owner === uid) {
        likedByEventKey[likedEventKey] = true
      }
    }
  }

  const questions: Question[] = firebaseToEntries(events)
    .reverse()
    .flatMap(({ key, val }) => {
      const eventKey = key
      const questionKey = String(val.payload.questionKey)
      const owner = val.owner
      const rawQuestion = data?.[owner]?.questions?.[questionKey]
      if (!rawQuestion) return []
      const liked = !!likedByEventKey[eventKey]
      const likes = +likesByEventKey[eventKey] || 0
      const question: Question = {
        eventKey,
        questionKey,
        owner,
        text: String(rawQuestion.text),
        liked,
        likes,
      }
      return [question]
    })
  return <>{props.children(questions)}</>
}
