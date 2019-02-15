import React, { ReactNode, Children } from 'react'
import { Box, Heading, DataTable, Button, Text } from 'grommet'
import { useSceneContext } from '../../core/app/SceneContext'
import { useFirebaseDatabase } from 'fiery'
import { LoadingContext, handlePromise, ActionButton } from '../../core/ui'
import firebase from 'firebase'
import λ from 'react-lambda'
import { firebaseToEntries } from '../../core/app';

const QuizImporter = React.lazy(() => import('./QuizImporter'))

function BackstageSection(props: { title: ReactNode; children: ReactNode }) {
  return (
    <Box>
      <Heading level="2" margin="none" size="small">
        {props.title}
      </Heading>
      <LoadingContext>{props.children}</LoadingContext>
    </Box>
  )
}

export function QuizBackstage() {
  const context = useSceneContext()
  return (
    <Box pad="small">
      <BackstageSection title="Questions">
        <QuizQuestionList />
      </BackstageSection>
      <BackstageSection title="Import questions">
        <QuizImporter
          import={async data => {
            await context.dataRef.child('questions').set(data)
          }}
        />
      </BackstageSection>
    </Box>
  )
}

export function QuizQuestionList() {
  const context = useSceneContext()
  const questionsRef = context.dataRef.child('questions')
  const questionsState = useFirebaseDatabase(questionsRef)
  // const sceneStateRef = context.dataRef.child('state')
  // const sceneStateState = useFirebaseDatabase(sceneStateRef)

  return (
    <Box pad="small">
      <DataTable
        columns={[
          { property: 'key', header: 'ID', primary: true },
          {
            property: '_status',
            header: 'Status',
            render: entry =>
              λ(() => {
                const currentQuestionState = useFirebaseDatabase(
                  context.dataRef.child('state').child('currentQuestion')
                )
                const currentQuestion = currentQuestionState.unstable_read()
                if (
                  currentQuestion &&
                  currentQuestion.questionId === entry.key
                ) {
                  return <Text>Active</Text>
                }
                return <Text>—</Text>
              })
          },
          {
            property: '_actions',
            header: 'Actions',
            render: entry => (
              <ActionButton
                color="dark-2"
                label="activate"
                description={`activate question "${entry.key}"`}
                onClick={() => activateQuestion(context.dataRef, entry)}
                successMessage={`Question "${entry.key}" activated!`}
              />
            )
          }
        ]}
        data={firebaseToEntries(questionsState.unstable_read())}
      />
    </Box>
  )
}

async function activateQuestion(
  sceneRef: firebase.database.Reference,
  entry: { key: string; val: any }
) {
  // const drift = (await firebase
  //   .database()
  //   .ref('.info/serverTimeOffset')
  //   .once('value')).val()
  await Promise.all([
    sceneRef
      .child('state')
      .child('released')
      .child(entry.key)
      .set({
        startedAt: firebase.database.ServerValue.TIMESTAMP,
        expiresIn: ((entry.val && entry.val.timeLimit) || 30) * 1000
      }),
    sceneRef
      .child('state')
      .child('currentQuestion')
      .set({
        questionId: entry.key,
        startedAt: firebase.database.ServerValue.TIMESTAMP,
        expiresIn: ((entry.val && entry.val.timeLimit) || 30) * 1000
      })
  ])
}
