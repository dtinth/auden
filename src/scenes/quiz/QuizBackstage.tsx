import React, { ReactNode, Children } from 'react'
import { Box, Heading, DataTable, Button, Text } from 'grommet'
import { useSceneContext } from '../../core/app/SceneContext'
import { useFirebaseDatabase } from 'fiery'
import {
  LoadingContext,
  handlePromise,
  ActionButton,
  ActionCheckbox,
  InlineLoadingContext
} from '../../core/ui'
import firebase from 'firebase'
import λ from 'react-lambda'
import { firebaseToEntries, UserName } from '../../core/app'
import { useLeaderboardData } from './useLeaderboardData'

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
      <BackstageSection title="Leaderboard">
        <QuizLeaderboard />
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
                const currentQuestionRef = context.dataRef
                  .child('state')
                  .child('currentQuestion')
                const currentQuestionState = useFirebaseDatabase(
                  currentQuestionRef
                )
                const currentQuestion = currentQuestionState.unstable_read()
                if (
                  currentQuestion &&
                  currentQuestion.questionId === entry.key
                ) {
                  return (
                    <Text>
                      Active{' '}
                      <ActionCheckbox
                        label="Reveal answer"
                        checked={currentQuestion.answerRevealed}
                        color="dark-2"
                        description="reveal answer"
                        onChange={async (e: any) =>
                          currentQuestionRef
                            .child('answerRevealed')
                            .set(e.target.checked)
                        }
                      />
                    </Text>
                  )
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
          },
          {
            property: '_answers',
            header: 'Answers',
            render: entry => (
              <InlineLoadingContext description="load answers">
                {λ(() => {
                  const answersState = useFirebaseDatabase(
                    context.dataRef.child('answers').child(entry.key)
                  )
                  const answers = answersState.unstable_read()
                  return <span>{firebaseToEntries(answers).length}</span>
                })}
                <ActionButton
                  color="dark-2"
                  label="grade"
                  description={`grade question "${entry.key}"`}
                  onClick={() => gradeQuestion(context.dataRef, entry)}
                  successMessage={`Question "${entry.key}" graded!`}
                />
              </InlineLoadingContext>
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
        answerChoices: Object.keys(entry.val.answers),
        startedAt: firebase.database.ServerValue.TIMESTAMP,
        expiresIn: ((entry.val && entry.val.timeLimit) || 30) * 1000
      }),
    sceneRef
      .child('state')
      .child('showLeaderboard')
      .set(false)
  ])
}

async function gradeQuestion(
  sceneRef: firebase.database.Reference,
  entry: { key: string; val: any }
) {
  const answers = firebaseToEntries(
    (await sceneRef
      .child('answers')
      .child(entry.key)
      .once('value')).val()
  ).sort((a, b) => a.val.timestamp - b.val.timestamp)
  const out = [] as Promise<void>[]
  let reward = 100
  for (const a of answers) {
    const uid = a.key
    const answerId = a.val.answerId
    const answer = entry.val.answers[answerId]
    if (answer && answer.correct) {
      const pointRef = sceneRef
        .child('state')
        .child('score')
        .child(uid)
        .child(entry.key)
      const points = reward
      out.push(pointRef.set(points))
      if (reward > 50) reward--
      console.log('Set %s to %s', pointRef.toString(), points)
    }
  }
  out.push(
    sceneRef
      .child('state')
      .child('showLeaderboard')
      .set(true)
  )
  await Promise.all(out)
}

export function QuizLeaderboard() {
  const leaderboardData = useLeaderboardData()
  return (
    <Box pad="small">
      <DataTable
        columns={[
          {
            property: 'key',
            header: 'Participant',
            primary: true,
            render: row => <UserName uid={row.uid} />
          },
          {
            property: 'val',
            header: 'Score',
            render: row => <span>{row.points}</span>
          }
        ]}
        data={leaderboardData}
      />
    </Box>
  )
}
