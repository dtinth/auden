import React, { useRef, useState, ChangeEvent } from 'react'
import { IScene } from '../../core/model'
import { Box, TextInput, Text, DataTable } from 'grommet'
import {
  ActionButton,
  ActionCheckbox,
  flashError,
  BackstageSection
} from '../../core/ui'
import { useSceneContext } from '../../core/app/SceneContext'
import { useFirebaseDatabase, useFirebaseAuth } from 'fiery'
import { firebaseToEntries } from '../../core/app'
import λ from 'react-lambda'

export const scene: IScene = {
  name: 'vote',
  backstageComponent: VoteBackstage,
  audienceComponent: VoteAudience
}

function VoteAudience() {
  const sceneContext = useSceneContext()

  // me
  const authState = useFirebaseAuth()
  const me = authState.unstable_read()!
  const uid = me.uid

  // vote options
  const optionsRef = sceneContext.dataRef.child('options')
  const optionsState = useFirebaseDatabase(optionsRef)
  const options = optionsState.unstable_read()

  // my votes
  const myVotesRef = sceneContext.dataRef.child('votes').child(uid)
  const myVotesState = useFirebaseDatabase(myVotesRef)
  const myVotes = myVotesState.unstable_read()
  const voteCount = firebaseToEntries(myVotes).filter(entry => entry.val).length
  const hasVotedFor = (optionId: string) => !!(myVotes && myVotes[optionId])

  const maxVotesRef = sceneContext.dataRef.child('settings').child('maxVotes')
  const maxVotesState = useFirebaseDatabase(maxVotesRef)
  const maxVotes = maxVotesState.unstable_read() || DEFAULT_MAX_VOTES

  return (
    <Box pad="small">
      <Box pad="xsmall">
        <Text>
          <Text weight="bold">Vote your favorite</Text> (max: {maxVotes}):
        </Text>
      </Box>
      {firebaseToEntries(options).map(entry => (
        <Box pad="xsmall" key={entry.key}>
          <ActionCheckbox
            label={entry.val}
            description={`vote for "${entry.val}"`}
            checked={hasVotedFor(entry.key)}
            onChange={async (e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.checked && voteCount >= maxVotes) {
                flashError('Cannot vote more than ' + maxVotes)
              } else {
                await myVotesRef.child(entry.key).set(e.target.checked)
              }
            }}
          />
        </Box>
      ))}
    </Box>
  )
}

const DEFAULT_MAX_VOTES = 1
function VoteBackstage() {
  const sceneContext = useSceneContext()
  const [voteOptionsText, setVoteOptionsText] = useState<string | null>(null)

  const optionsRef = sceneContext.dataRef.child('options')
  const optionsState = useFirebaseDatabase(optionsRef)
  const options = optionsState.unstable_read()

  const initialVoteOptionsText = firebaseToEntries(options)
    .map(entry => entry.val)
    .join('/')
  const textValue =
    voteOptionsText != null ? voteOptionsText : initialVoteOptionsText

  const maxVotesRef = sceneContext.dataRef.child('settings').child('maxVotes')
  const maxVotesState = useFirebaseDatabase(maxVotesRef)
  const maxVotes = maxVotesState.unstable_read() || DEFAULT_MAX_VOTES

  return (
    <Box>
      <BackstageSection title="Available options">
        <Box direction="row" align="center">
          <Box flex margin={{ right: 'small' }}>
            <TextInput
              value={textValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setVoteOptionsText(e.target.value)
              }
            />
          </Box>
          <Box flex={false} margin={{ right: 'small' }}>
            <ActionButton
              label="Set vote options"
              description="set vote options"
              onClick={async () => {
                const options = {} as any
                let n = 0
                for (const item of textValue.split('/').filter(x => x)) {
                  options['option' + ('' + n++).padStart(2, '0')] = item
                }
                await optionsRef.set(options)
              }}
              successMessage="Vote options has been set"
            />
          </Box>
          <Box flex={false}>
            <ActionButton
              label={`Max votes: ${maxVotes}`}
              description="set max votes"
              onClick={async () => {
                const howMany = +prompt(
                  'How many votes max per person?',
                  maxVotes
                )!
                if (howMany) await maxVotesRef.set(howMany)
              }}
              successMessage="Maximum vote count has been set"
            />
          </Box>
        </Box>
      </BackstageSection>
      <BackstageSection title="Vote results">
        {λ(() => {
          const allVotesRef = sceneContext.dataRef.child('votes')
          const allVotesState = useFirebaseDatabase(allVotesRef)
          const allVotes = firebaseToEntries(allVotesState.unstable_read())
          const voteResult = firebaseToEntries(options)
            .map(entry => {
              const optionId = entry.key
              const optionText = entry.val
              const voteCount = allVotes.filter(voterEntry => {
                const voterVotes = voterEntry.val
                return !!(voterVotes && voterVotes[optionId])
              }).length
              return { optionText, voteCount }
            })
            .sort((a, b) => b.voteCount - a.voteCount)
          return (
            <DataTable
              columns={[
                { header: 'Option', property: 'optionText', primary: true },
                { header: 'Votes', property: 'voteCount', primary: true }
              ]}
              data={voteResult}
            />
          )
        })}
      </BackstageSection>
    </Box>
  )
}
