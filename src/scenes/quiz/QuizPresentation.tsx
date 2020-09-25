import { useFirebaseDatabase } from 'fiery'
import { Box, Grid, Text } from 'grommet'
import React from 'react'
import { firebaseToEntries, UserName } from '../../core/app'
import { useSceneContext } from '../../core/app/SceneContext'
import { useLeaderboardData } from './useLeaderboardData'

export function QuizPresentation() {
  const context = useSceneContext()
  const questionsState = useFirebaseDatabase(
    context.dataRef.child('main').child('questions').child('secret')
  )
  const currentQuestionState = useFirebaseDatabase(
    context.dataRef
      .child('main')
      .child('state')
      .child('public-read')
      .child('currentQuestion')
  )
  const showLeaderboardState = useFirebaseDatabase(
    context.dataRef
      .child('main')
      .child('state')
      .child('public-read')
      .child('showLeaderboard')
  )
  if (showLeaderboardState.unstable_read()) {
    return <QuizLeaderboardPresentation />
  }
  const questions = questionsState.unstable_read()
  const currentQuestion = currentQuestionState.unstable_read()
  const currentQuestionId = currentQuestion && currentQuestion.questionId
  const question =
    questions && currentQuestionId && questions[currentQuestionId]
  if (question) {
    return (
      <QuizQuestionPresentation
        question={question}
        answerRevealed={currentQuestion.answerRevealed}
      />
    )
  }
  return (
    <Box pad="xlarge">
      <Text size="xlarge">No active question...</Text>
    </Box>
  )
}

export function QuizQuestionPresentation(props: {
  question: any
  answerRevealed: boolean
}) {
  const { question } = props
  return (
    <Box fill>
      <Box pad="medium" background="dark-1" flex={false}>
        <Text alignSelf="center" textAlign="center" size="64px">
          <div dangerouslySetInnerHTML={{ __html: question.text }} />
        </Text>
      </Box>
      <Box flex>
        <Grid
          fill
          gap="small"
          margin={{ top: 'small' }}
          columns={question.columns === 1 ? ['auto'] : ['1/2', '1/2']}
          style={{
            gridTemplateRows: 'repeat(auto-fill, 1fr)',
          }}
        >
          {firebaseToEntries(question.answers).map((entry, index) => {
            return (
              <Box
                key={index}
                background={`neutral-${index + 1}`}
                style={{
                  position: 'relative',
                  fontSize: '56px',
                  lineHeight: '72px',
                  opacity: props.answerRevealed && !entry.val.correct ? 0.5 : 1,
                }}
              >
                <Box
                  align="baseline"
                  pad="medium"
                  direction="row"
                  style={{
                    position: 'absolute',
                    background: 'rgba(0,0,0,0.5)',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                >
                  <Box
                    flex={false}
                    background={`neutral-${index + 1}`}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      textShadow: '2px 2px 1px rgba(0,0,0,0.5)',
                      fontWeight: 'bold',
                    }}
                    align="center"
                    justify="center"
                    margin={{ right: 'medium' }}
                  >
                    {String.fromCharCode(65 + index)}
                  </Box>
                  <Box flex>
                    <div dangerouslySetInnerHTML={{ __html: entry.val.text }} />
                  </Box>
                </Box>
              </Box>
            )
          })}
        </Grid>
      </Box>
    </Box>
  )
}

function QuizLeaderboardPresentation() {
  const leaderboardData = useLeaderboardData()
  return (
    <Box fill>
      <Box pad="medium" background="dark-1" flex={false}>
        <Text alignSelf="center" textAlign="center" size="64px">
          Leaderboard
        </Text>
      </Box>
      <Box flex pad="small" style={{ fontSize: '56px', lineHeight: '72px' }}>
        {leaderboardData.slice(0, 8).map((entry) => {
          return (
            <Box direction="row" pad="small">
              <Box flex>
                <UserName uid={entry.uid} />
              </Box>
              <Box style={{ textAlign: 'right' }}>{entry.points}</Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
