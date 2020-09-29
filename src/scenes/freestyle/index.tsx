import { Box, TextArea } from 'grommet'
import React, { ReactNode, useState } from 'react'
import { SceneDataConnector } from '../../core/app/SceneContext'
import { IScene } from '../../core/model'
import { ActionButton, Draft, Field, Panel } from '../../core/ui'

export const scene: IScene = {
  name: 'freestyle',
  backstageComponent: FreestyleBackstage,
  presentationComponent: FreestylePresentation,
  audienceComponent: FreestyleAudience,
}

const AUDIENCE_TEXT_PATH = ['main', 'settings', 'public-read', 'audienceText']

function FreestyleAudience() {
  return (
    <Box pad="small">
      <SceneDataConnector path={AUDIENCE_TEXT_PATH}>
        {(audienceText) => (
          <div
            dangerouslySetInnerHTML={{ __html: String(audienceText.value) }}
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
        <Box pad="small">
          <Field label="Text to show">
            <SceneDataConnector path={AUDIENCE_TEXT_PATH}>
              {(audienceText) => (
                <Draft
                  value={audienceText.value || ''}
                  onSave={(value) => audienceText.ref.set(value)}
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

function FreestylePresentation() {
  return <Box fill>Freestyle!</Box>
}
