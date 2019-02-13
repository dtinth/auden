import { Box, Button, Heading, Text } from 'grommet'
import Noty from 'noty'
import 'noty/lib/noty.css'
import 'noty/lib/themes/mint.css'
import React, { ReactNode, Suspense } from 'react'

export function flashError(text: string) {
  new Noty({ text, type: 'error' }).show()
}

export function flashSuccess(text: string) {
  new Noty({
    text: text,
    type: 'success',
    timeout: 5000
  }).show()
}

export class ErrorBoundary extends React.Component<{}, { error?: Error }> {
  constructor(props: {}) {
    super(props)
    this.state = {}
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return <ErrorMessage message={String(this.state.error)} />
    }
    return this.props.children
  }
}

export function ErrorMessage(props: { message: string }) {
  return (
    <Box background="status-error" pad="medium">
      <Heading level="1" margin={{ top: 'none', bottom: 'small' }}>
        Error :(
      </Heading>
      <Text size="large">{props.message}</Text>
    </Box>
  )
}

export class InlineErrorBoundary extends React.Component<
  { description: string },
  { error?: Error }
> {
  constructor(props: { description: string }) {
    super(props)
    this.state = {}
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    flashError(`Failed to ${this.props.description}: ${error}`)
    console.error(error)
  }
  render() {
    if (this.state.error) {
      return (
        <Text color="status-error">
          <Button
            plain
            label=":("
            onClick={() => window.alert(this.state.error)}
          />
        </Text>
      )
    }
    return this.props.children
  }
}

export function InlineLoadingContext(props: {
  children: ReactNode
  description: string
}) {
  return (
    <InlineErrorBoundary description={props.description}>
      <Suspense fallback={'...'}>{props.children}</Suspense>
    </InlineErrorBoundary>
  )
}
