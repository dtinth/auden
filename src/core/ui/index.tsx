import { Box, Button, Heading, Text, Layer, ButtonProps } from 'grommet'
import Noty from 'noty'
import 'noty/lib/noty.css'
import 'noty/lib/themes/mint.css'
import React, {
  ReactNode,
  Suspense,
  useState,
  useMemo,
  useCallback
} from 'react'

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

export function Loading() {
  return (
    <Layer modal={false} responsive={false}>
      <Text size="xxlarge" color="light-6">
        Loading...
      </Text>
    </Layer>
  )
}

export function LoadingContext(props: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>{props.children}</Suspense>
    </ErrorBoundary>
  )
}

export async function handlePromise<T>(
  description: string,
  promise: Promise<T>
): Promise<T> {
  try {
    return await promise
  } catch (error) {
    flashError(`Failed to ${description}: ${error}`)
    throw error
  }
}

export function useActionRunner(): [
  boolean,
  <T>(
    description: string,
    f: () => Promise<T>,
    successMessage?: string
  ) => Promise<T>
] {
  const [running, setRunning] = useState(false)
  const run = useCallback(async (s, f, m) => {
    let failed = false
    setRunning(true)
    try {
      return await f()
    } catch (e) {
      failed = true
      flashError(`Failed to ${s}: ${e}`)
      throw e
    } finally {
      if (!failed && m) flashSuccess(m)
      setRunning(false)
    }
  }, [])
  return [running, run]
}

export function ActionButton(
  props: ButtonProps & JSX.IntrinsicElements['button']
) {
  const [running, run] = useActionRunner()
  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (props.onClick) {
      const onClick = props.onClick
      run('run', () => onClick(e))
    }
  }
  return (
    <Button {...props} onClick={onClick} disabled={props.disabled || running} />
  )
}
