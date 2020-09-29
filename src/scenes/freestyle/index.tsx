import { useFirebaseAuth, useFirebaseDatabase } from 'fiery'
import { Box, DataTable, Text, TextInput } from 'grommet'
import React, { ChangeEvent, useState } from 'react'
import { firebaseToEntries } from '../../core/app'
import {
  SceneDataConnector,
  useSceneContext,
} from '../../core/app/SceneContext'
import { IScene } from '../../core/model'
import {
  ActionButton,
  ActionCheckbox,
  flashError,
  InlineLoadingContext,
  Panel,
} from '../../core/ui'

export const scene: IScene = {
  name: 'freestyle',
  backstageComponent: FreestyleBackstage,
  presentationComponent: FreestylePresentation,
  audienceComponent: FreestyleAudience,
}

function FreestyleAudience() {
  return <Box pad="small">Freestyle!</Box>
}

function FreestyleBackstage() {
  return (
    <Box gap="medium">
      <Panel title="Example">
        <Box pad="small">Freestyle!</Box>
      </Panel>
    </Box>
  )
}

function FreestylePresentation() {
  return <Box fill>Freestyle!</Box>
}
