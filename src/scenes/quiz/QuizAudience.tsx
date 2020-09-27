import { useFirebaseDatabase, useFirebaseAuth } from 'fiery'
import { Box, Grid, Text } from 'grommet'
import React from 'react'
import { useSceneContext } from '../../core/app/SceneContext'
import { ActionButton } from '../../core/ui'
import firebase from 'firebase'
import λ from 'react-lambda'

export function QuizAudience() {
  const context = useSceneContext()
  const currentQuestionState = useFirebaseDatabase(
    context.dataRef
      .child('main')
      .child('state')
      .child('public-read')
      .child('currentQuestion')
  )
  const userState = useFirebaseAuth()
  const me = userState.unstable_read()!
  const currentQuestion = currentQuestionState.unstable_read()
  const currentQuestionId = currentQuestion && currentQuestion.questionId
  if (currentQuestionId) {
    const answerRef = context.dataRef
      .child('answers')
      .child(currentQuestionId)
      .child('private')
      .child(me.uid)
    return λ(() => {
      // Using hooks in λ is okay but now that `react-script` refuses to compile this, we should use `fiery.Data` instead.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const answerState = useFirebaseDatabase(answerRef)
      const answer = answerState.unstable_read()
      if (currentQuestion.answerRevealed) {
        return (
          <Box pad="xlarge">
            <Text size="xlarge">{currentQuestionId}</Text>
            <br />
            Answer has been revealed!
            <br />
            Wait for next question...
          </Box>
        )
      }
      if (answer) {
        return (
          <Box pad="xlarge">
            <Text size="xlarge">{currentQuestionId}</Text>
            <br />
            Answered! Wait for result...
          </Box>
        )
      }
      return (
        <Box pad="xlarge">
          <Text size="xlarge">{currentQuestionId}</Text>
          <Grid
            rows={['xsmall', 'xsmall']}
            columns={['1/2', '1/2']}
            gap="small"
            margin={{ top: 'medium' }}
          >
            {(currentQuestion.answerChoices || []).map(
              (answerId: string, i: number) => (
                <ActionButton
                  primary
                  color={`neutral-${i + 1}`}
                  key={answerId}
                  label={
                    <Text size="large">{String.fromCharCode(65 + i)}</Text>
                  }
                  onClick={async () => {
                    await answerRef.set({
                      answerId: answerId,
                      timestamp: firebase.database.ServerValue.TIMESTAMP,
                    })
                  }}
                />
              )
            )}
          </Grid>
        </Box>
      )
    })
  }
  return (
    <Box pad="xlarge">
      <Text size="xlarge">Wait for a question!</Text>
    </Box>
  )
}
