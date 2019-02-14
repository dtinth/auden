import React from 'react'
import { Box, Heading } from 'grommet'
import { useSceneContext } from '../../core/app/SceneContext'

const QuizImporter = React.lazy(() => import('./QuizImporter'))

export function QuizBackstage() {
  const context = useSceneContext()
  return (
    <Box pad="small">
      <Heading level="2">Import questions</Heading>
      <QuizImporter
        import={async data => {
          await context.dataRef.child('questions').set(data)
        }}
      />
    </Box>
  )
}
