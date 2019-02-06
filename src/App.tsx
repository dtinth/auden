import React, { useState, Suspense } from 'react'
import { Grommet, Text, Box, Button, Heading, Paragraph, Layer } from 'grommet'
import { dark, generate } from 'grommet/themes'
import { deepMerge } from 'grommet/utils'

const theme = deepMerge(generate(24, 6), dark, {
  global: {
    font: {
      family: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`
    }
  }
})
console.log(theme)

function App() {
  return (
    <Grommet theme={theme} full>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Box>
            <Text>Text</Text>
            <Button label="Button" onClick={() => {}} />
            <A />
          </Box>
        </Suspense>
      </ErrorBoundary>
    </Grommet>
  )
}

function Loading() {
  return (
    <Layer modal={false}>
      <Text size="xxlarge" color="light-6">
        Loading...
      </Text>
    </Layer>
  )
}

function A() {
  throw new Promise(resolve => {})
  return <div />
}

class ErrorBoundary extends React.Component<{}, { error?: Error }> {
  constructor(props: {}) {
    super(props)
    this.state = {}
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <Box background="status-error" pad="medium">
          <Heading level="1" margin={{ top: 'none', bottom: 'small' }}>
            Error :(
          </Heading>
          <Text size="large">{String(this.state.error)}</Text>
        </Box>
      )
    }
    return this.props.children
  }
}

export default App
