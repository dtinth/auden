import { Box, RadioButtonGroup, TextArea } from 'grommet'
import React, { ChangeEvent } from 'react'
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
const AUDIENCE_TEXT_PATH = ['main', 'settings', 'public-read', 'audienceText']
const AUDIENCE_CSS_PATH = ['main', 'settings', 'public-read', 'audienceCSS']
const PRESENTATION_TEXT_PATH = [
  'main',
  'settings',
  'public-read',
  'presentationText',
]
const PRESENTATION_CSS_PATH = [
  'main',
  'settings',
  'public-read',
  'presentationCSS',
]
const PRESENTATION_SETTINGS_PATH = [
  'main',
  'settings',
  'public-read',
  'presentationSettings',
]

function FreestyleAudience() {
  return (
    <Box pad="small">
      <SceneDataConnector path={AUDIENCE_DISPLAY_MODE_PATH}>
        {(displayMode) => {
          return <QuestionAudience />

          if (displayMode.value === 'chat') {
            return <ChatAudience />
          }

          return (
            <>
              <SceneDataConnector path={AUDIENCE_TEXT_PATH}>
                {(audienceText) => (
                  <div
                    id="freestyle"
                    dangerouslySetInnerHTML={{
                      __html: String(audienceText.value),
                    }}
                  />
                )}
              </SceneDataConnector>
              <SceneDataConnector path={AUDIENCE_CSS_PATH}>
                {(audienceCSS) => (
                  <style
                    dangerouslySetInnerHTML={{
                      __html: String(audienceCSS.value),
                    }}
                  />
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
            <SceneDataConnector path={PRESENTATION_TEXT_PATH}>
              {(audienceText) => (
                <div
                  id="freestyle"
                  dangerouslySetInnerHTML={{
                    __html: String(audienceText.value),
                  }}
                />
              )}
            </SceneDataConnector>
            <SceneDataConnector path={PRESENTATION_CSS_PATH}>
              {(audienceCSS) => (
                <style
                  dangerouslySetInnerHTML={{
                    __html: String(audienceCSS.value),
                  }}
                />
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
  return (
    <Box gap="medium">
      <Panel title="Audience view">
        <Box pad="small" gap="small">
          <Field label="Display">
            <SceneDataConnector path={AUDIENCE_DISPLAY_MODE_PATH}>
              {(setting) => (
                <RadioButtonGroup
                  name="displayMode"
                  options={['arbitrary', 'chat']}
                  value={setting.value || 'arbitrary'}
                  onChange={(event: any) => {
                    setting.ref.set(event.target.value)
                  }}
                />
              )}
            </SceneDataConnector>
          </Field>

          <Field label="Text to show">
            <SceneDataConnector path={AUDIENCE_TEXT_PATH}>
              {(text) => (
                <Draft
                  value={text.value || ''}
                  onSave={(value) => text.ref.set(value)}
                >
                  {(draft, setDraft) => (
                    <TextArea
                      rows={8}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  )}
                </Draft>
              )}
            </SceneDataConnector>
          </Field>

          <Field label="Audience CSS">
            <SceneDataConnector path={AUDIENCE_CSS_PATH}>
              {(text) => (
                <Draft
                  value={text.value || ''}
                  onSave={(value) => text.ref.set(value)}
                >
                  {(draft, setDraft) => (
                    <TextArea
                      rows={8}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  )}
                </Draft>
              )}
            </SceneDataConnector>
          </Field>
        </Box>
      </Panel>

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

          <Field label="Text to show">
            <SceneDataConnector path={PRESENTATION_TEXT_PATH}>
              {(text) => (
                <Draft
                  value={text.value || ''}
                  onSave={(value) => text.ref.set(value)}
                >
                  {(draft, setDraft) => (
                    <TextArea
                      rows={8}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  )}
                </Draft>
              )}
            </SceneDataConnector>
          </Field>

          <Field label="Presentation CSS">
            <SceneDataConnector path={PRESENTATION_CSS_PATH}>
              {(text) => (
                <Draft
                  value={text.value || ''}
                  onSave={(value) => text.ref.set(value)}
                >
                  {(draft, setDraft) => (
                    <TextArea
                      rows={8}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  )}
                </Draft>
              )}
            </SceneDataConnector>
          </Field>
        </Box>
      </Panel>
    </Box>
  )
}
