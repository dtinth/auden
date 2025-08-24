import { Box, Button, RadioButtonGroup, TextArea, TextInput } from 'grommet'
import React, { ChangeEvent, useState, useId } from 'react'
import { SceneDataConnector } from '../../core/app/SceneContext'
import { IScene } from '../../core/model'
import { ActionCheckbox, Draft, Field, Panel } from '../../core/ui'
import { ChatAudience, ChatView } from './Chat'
import { QuestionAudience } from './Questions'

export const scene: IScene = {
  name: 'freestyle',
  backstageComponent: FreestyleBackstage,
  presentationComponent: FreestylePresentation,
  audienceComponent: FreestyleAudience,
}

const AUDIENCE_DISPLAY_MODE_PATH = [
  'main',
  'settings',
  'public-read',
  'audienceDisplayMode',
]
const AUDIENCE_ARBITRARY_PATH = [
  'main',
  'settings',
  'public-read',
  'audienceArbitrary',
]
const PRESENTATION_ARBITRARY_PATH = [
  'main',
  'settings',
  'public-read',
  'presentationArbitrary',
]
const PRESENTATION_SETTINGS_PATH = [
  'main',
  'settings',
  'public-read',
  'presentationSettings',
]

function Both() {
  const [mode, setMode] = useState('chat')
  return (
    <>
      <Box direction="row">
        <Button label="chat" onClick={() => setMode('chat')} />
        <Button label="questions" onClick={() => setMode('questions')} />
      </Box>
      <Box>{mode === 'chat' ? <ChatAudience /> : <QuestionAudience />}</Box>
    </>
  )
}

function FreestyleAudience() {
  return (
    <Box pad="small">
      <SceneDataConnector path={AUDIENCE_DISPLAY_MODE_PATH}>
        {(displayMode) => {
          if (displayMode.value === 'both') {
            return <Both />
          }
          if (displayMode.value === 'chat') {
            return <ChatAudience />
          }
          if (displayMode.value === 'questions') {
            return <QuestionAudience />
          }

          return (
            <>
              <SceneDataConnector path={AUDIENCE_ARBITRARY_PATH}>
                {(data) => (
                  <>
                    <div
                      id="freestyle"
                      dangerouslySetInnerHTML={{
                        __html: String(data.value?.html || ''),
                      }}
                    />
                    <style
                      dangerouslySetInnerHTML={{
                        __html: String(data.value?.css || ''),
                      }}
                    />
                  </>
                )}
              </SceneDataConnector>
            </>
          )
        }}
      </SceneDataConnector>
    </Box>
  )
}

function FreestylePresentation() {
  return (
    <Box fill>
      <SceneDataConnector path={PRESENTATION_SETTINGS_PATH}>
        {(settings) => (
          <>
            <SceneDataConnector path={PRESENTATION_ARBITRARY_PATH}>
              {(data) => (
                <>
                  <div
                    id="freestyle"
                    dangerouslySetInnerHTML={{
                      __html: String(data.value?.html || ''),
                    }}
                  />
                  <style
                    dangerouslySetInnerHTML={{
                      __html: String(data.value?.css || ''),
                    }}
                  />
                </>
              )}
            </SceneDataConnector>
            {!!settings.value?.showChat && <ChatView />}
          </>
        )}
      </SceneDataConnector>
    </Box>
  )
}

function FreestyleBackstage() {
  const baseId = useId()
  
  return (
    <Box gap="medium">
      <Panel title="Presentation view">
        <Box pad="small" gap="small">
          <Field label="Display">
            <SceneDataConnector path={PRESENTATION_SETTINGS_PATH}>
              {(settings) => (
                <>
                  <ActionCheckbox
                    label={'Show chat'}
                    description={`show chat`}
                    checked={!!settings.value?.showChat}
                    onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                      await settings.ref.child('showChat').set(e.target.checked)
                    }}
                  />
                </>
              )}
            </SceneDataConnector>
          </Field>

          <Field label="Class names" htmlFor={`${baseId}-presentationClass`}>
            <FreestyleStringSettingEditor
              path={[...PRESENTATION_SETTINGS_PATH, 'className']}
              inputId={`${baseId}-presentationClass`}
            />
          </Field>

          <Field label="Arbitrary HTML" htmlFor={`${baseId}-presentationHtml`}>
            <FreestyleTextSettingEditor
              path={[...PRESENTATION_ARBITRARY_PATH, 'html']}
              inputId={`${baseId}-presentationHtml`}
            />
          </Field>

          <Field label="Arbitrary CSS" htmlFor={`${baseId}-presentationCss`}>
            <FreestyleTextSettingEditor
              path={[...PRESENTATION_ARBITRARY_PATH, 'css']}
              inputId={`${baseId}-presentationCss`}
            />
          </Field>
        </Box>
      </Panel>

      <Panel title="Audience view">
        <Box pad="small" gap="small">
          <Field label="Display">
            <SceneDataConnector path={AUDIENCE_DISPLAY_MODE_PATH}>
              {(setting) => (
                <RadioButtonGroup
                  name="displayMode"
                  options={['arbitrary', 'chat', 'questions', 'both']}
                  value={setting.value || 'arbitrary'}
                  onChange={(event: any) => {
                    setting.ref.set(event.target.value)
                  }}
                />
              )}
            </SceneDataConnector>
          </Field>

          <Field label="Arbitrary HTML" htmlFor={`${baseId}-audienceHtml`}>
            <FreestyleTextSettingEditor
              path={[...AUDIENCE_ARBITRARY_PATH, 'html']}
              inputId={`${baseId}-audienceHtml`}
            />
          </Field>

          <Field label="Arbitrary CSS" htmlFor={`${baseId}-audienceCss`}>
            <FreestyleTextSettingEditor
              path={[...AUDIENCE_ARBITRARY_PATH, 'css']}
              inputId={`${baseId}-audienceCss`}
            />
          </Field>
        </Box>
      </Panel>
    </Box>
  )
}

function FreestyleTextSettingEditor(props: { 
  path: string[]
  inputId?: string
}) {
  return (
    <SceneDataConnector path={props.path}>
      {(text) => (
        <Draft value={text.value || ''} onSave={(value) => text.ref.set(value)}>
          {(draft, setDraft) => (
            <TextArea
              id={props.inputId}
              rows={8}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          )}
        </Draft>
      )}
    </SceneDataConnector>
  )
}

function FreestyleStringSettingEditor(props: { 
  path: string[]
  inputId?: string
}) {
  return (
    <SceneDataConnector path={props.path}>
      {(text) => (
        <Draft
          singleLine
          value={text.value || ''}
          onSave={(value) => text.ref.set(value)}
        >
          {(draft, setDraft) => (
            <TextInput
              id={props.inputId}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          )}
        </Draft>
      )}
    </SceneDataConnector>
  )
}
