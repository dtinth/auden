import {
  Box,
  Button,
  ButtonProps,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CheckBox,
  CheckBoxProps,
  Heading,
  Layer,
  Text,
} from 'grommet'
import Noty from 'noty'
import 'noty/lib/noty.css'
import 'noty/lib/themes/mint.css'
import React, { ReactNode, Suspense, useCallback, useState } from 'react'

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

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
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
  { description: string; children: React.ReactNode },
  { error?: Error }
> {
  constructor(props: { description: string; children: React.ReactNode }) {
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
  fallback?: ReactNode
}) {
  return (
    <InlineErrorBoundary description={props.description}>
      <Suspense fallback={props.fallback ?? '...'}>{props.children}</Suspense>
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
  const run = useCallback(async (description: string, f: () => Promise<any>, successMessage?: string) => {
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
  const onClick = async (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.persist()
    e.preventDefault()
    if (props.onClick) {
      const originalOnClick = props.onClick
      run(
        props.description || 'run',
        async () => originalOnClick(e as any),
        props.successMessage
      )
    }
  }
  return (
    <Button {...props as any} onClick={onClick} disabled={props.disabled || running} />
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

export function Panel(props: {
  title: ReactNode
  bottomBar?: ReactNode
  topBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Card background="black" role="region" aria-label={String(props.title)}>
      <CardHeader pad="small" background="dark-2">
        <strong>{props.title}</strong>
      </CardHeader>
      {props.topBar ? (
        <CardHeader
          pad={{ horizontal: 'small' }}
          background="dark-1"
          direction="row"
        >
          {props.topBar}
        </CardHeader>
      ) : null}
      <CardBody>{props.children}</CardBody>
      {props.bottomBar ? (
        <CardFooter
          pad={{ horizontal: 'small' }}
          background="dark-1"
          direction="row"
        >
          {props.bottomBar}
        </CardFooter>
      ) : null}
    </Card>
  )
}

export function ToolbarFiller() {
  return <Box flex />
}

export type ConnectorType<
  Props extends {},
  Args extends any[]
> = React.ComponentType<
  Props & {
    children: (...args: Args) => React.ReactNode
  }
>

export function Field(props: { label: ReactNode; children: ReactNode }) {
  return (
    <Box direction="row">
      <Box width="10rem">{props.label}</Box>
      <Box flex>{props.children}</Box>
    </Box>
  )
}

export function Draft(props: {
  value: string
  children: (draft: string, setDraft: (d: string) => void) => ReactNode
  onSave: (value: string) => Promise<void>
  singleLine?: boolean
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const draftValue = draft ?? props.value
  return (
    <Box gap="xsmall" direction={props.singleLine ? 'row' : 'column'}>
      {props.children(draftValue, setDraft)}
      <Box direction="row">
        <ActionButton
          label="Save"
          description="save"
          successMessage="Saved"
          onClick={() => props.onSave(draftValue)}
          disabled={draftValue === props.value}
        />
      </Box>
    </Box>
  )
}
