import {
  Box,
  Button,
  Heading,
  Text,
  Layer,
  ButtonProps,
  CheckBoxProps,
  CheckBox,
} from 'grommet'
import Noty from 'noty'
import 'noty/lib/noty.css'
import 'noty/lib/themes/mint.css'
import React, {
  ReactNode,
  Suspense,
  useState,
  useMemo,
  useCallback,
} from 'react'

export function flashError(text: string) {
  new Noty({ text, type: 'error' }).show()
}

export function flashSuccess(text: string) {
  new Noty({
    text: text,
    type: 'success',
    timeout: 5000,
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

export function Loading(props: { message?: string }) {
  return (
    <Layer modal={false} responsive={false}>
      <Text size="xxlarge" color="light-6">
        {props.message || 'Loading'}...
      </Text>
    </Layer>
  )
}

export function LoadingContext(props: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <Box pad="medium">
            <Text size="xxlarge" color="light-6">
              Loading...
            </Text>
          </Box>
        }
      >
        {props.children}
      </Suspense>
    </ErrorBoundary>
  )
}

export async function handlePromise<T>(
  description: string,
  promise: Promise<T>,
  successMessage?: string
): Promise<T> {
  let failed = false
  try {
    return await promise
  } catch (error) {
    failed = true
    flashError(`Failed to ${description}: ${error}`)
    throw error
  } finally {
    if (!failed && successMessage) flashSuccess(successMessage)
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
  const run = useCallback(async (description, f, successMessage) => {
    let failed = false
    setRunning(true)
    try {
      return await f()
    } catch (e) {
      failed = true
      flashError(`Failed to ${description}: ${e}`)
      throw e
    } finally {
      if (!failed && successMessage) flashSuccess(successMessage)
      setRunning(false)
    }
  }, [])
  return [running, run]
}

export function ActionButton(
  props: ButtonProps &
    JSX.IntrinsicElements['button'] & {
      description?: string
      successMessage?: string
    }
) {
  const [running, run] = useActionRunner()
  const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.persist()
    e.preventDefault()
    if (props.onClick) {
      const onClick = props.onClick
      run(
        props.description || 'run',
        async () => onClick(e),
        props.successMessage
      )
    }
  }
  return (
    <Button {...props} onClick={onClick} disabled={props.disabled || running} />
  )
}

export function ActionCheckbox(
  props: CheckBoxProps &
    JSX.IntrinsicElements['input'] & {
      description?: string
      successMessage?: string
    }
) {
  const [running, run] = useActionRunner()
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist()
    e.preventDefault()
    if (props.onChange) {
      const onChange = props.onChange
      run(
        props.description || 'run',
        async () => onChange(e),
        props.successMessage
      )
    }
  }
  return (
    <CheckBox
      {...props}
      onChange={onChange}
      disabled={props.disabled || running}
    />
  )
}

export function BackstageSection(props: {
  title: ReactNode
  children: ReactNode
}) {
  return (
    <Box>
      <Box pad="small" background="dark-1">
        <Heading level="2" margin="none" size="small">
          {props.title}
        </Heading>
      </Box>
      <LoadingContext>
        <Box pad="small">{props.children}</Box>
      </LoadingContext>
    </Box>
  )
}

export type ConnectorType<
  Props extends {},
  Args extends any[]
> = React.ComponentType<
  Props & {
    children: (...args: Args) => React.ReactNode
  }
>
