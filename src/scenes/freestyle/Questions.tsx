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

export function QuestionAudience() {
  return (
    <Box gap="small">
      <Box>
        <QuestionSubmitter />
      </Box>
      <Box>
        <QuestionView />
      </Box>
    </Box>
  )
}

export function QuestionView() {
  return (
    <Box className="QuestionView" gap="small">
      <LoadingContext>
        <QuestionsConnector>
          {(questions) => {
            return questions.map((question) => (
              <div key={question.eventKey} className="QuestionView__item">
                <Box border round pad="small">
                  <strong style={{ color: getUserColor(question.owner) }}>
                    <UserName uid={question.owner} />:{' '}
                  </strong>
                  {question.text}
                </Box>
              </div>
            ))
          }}
        </QuestionsConnector>
      </LoadingContext>
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
    dataRef
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
  const questions: Question[] = firebaseToEntries(events)
    .reverse()
    .flatMap(({ key, val }) => {
      const eventKey = key
      const questionKey = String(val.payload.questionKey)
      const owner = val.owner
      const rawQuestion = data?.[owner]?.questions?.[questionKey]
      return rawQuestion
        ? [{ eventKey, questionKey, owner, text: String(rawQuestion.text) }]
        : []
    })
  return <>{props.children(questions)}</>
}
