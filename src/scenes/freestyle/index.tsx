import { Box, TextArea } from 'grommet'
import React, { ReactNode, useState } from 'react'
import { SceneDataConnector } from '../../core/app/SceneContext'
import { IScene } from '../../core/model'
import { ActionButton, Draft, Field, Panel } from '../../core/ui'
import { ChatAudience } from './Chat'

export const scene: IScene = {
  name: 'freestyle',
  backstageComponent: FreestyleBackstage,
  presentationComponent: FreestylePresentation,
  audienceComponent: FreestyleAudience,
}

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

function FreestyleAudience() {
  return (
    <Box pad="small">
      <SceneDataConnector path={AUDIENCE_TEXT_PATH}>
        {(audienceText) => (
          <div
            id="freestyle"
            dangerouslySetInnerHTML={{ __html: String(audienceText.value) }}
          />
        )}
      </SceneDataConnector>
      <SceneDataConnector path={AUDIENCE_CSS_PATH}>
        {(audienceCSS) => (
          <style
            dangerouslySetInnerHTML={{ __html: String(audienceCSS.value) }}
          />
        )}
      </SceneDataConnector>
      <ChatAudience />
    </Box>
  )
}

function FreestylePresentation() {
  return (
    <Box fill>
      <SceneDataConnector path={PRESENTATION_TEXT_PATH}>
        {(audienceText) => (
          <div
            id="freestyle"
            dangerouslySetInnerHTML={{ __html: String(audienceText.value) }}
          />
        )}
      </SceneDataConnector>
      <SceneDataConnector path={PRESENTATION_CSS_PATH}>
        {(audienceCSS) => (
          <style
            dangerouslySetInnerHTML={{ __html: String(audienceCSS.value) }}
          />
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
