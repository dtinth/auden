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
  presentationComponent: VotePresentation,
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

  // max votes
  const maxVotesRef = sceneContext.dataRef.child('settings').child('maxVotes')
  const maxVotesState = useFirebaseDatabase(maxVotesRef)
  const maxVotes = maxVotesState.unstable_read() || DEFAULT_MAX_VOTES

  // enabled?
  const enabledRef = sceneContext.dataRef.child('settings').child('enabled')
  const enabledState = useFirebaseDatabase(enabledRef)
  const enabled = enabledState.unstable_read()

  if (!enabled) {
    return <Box pad="medium">Wait for voting to open...</Box>
  }

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
          <Box flex={false} margin={{ right: 'small' }}>
            {λ(() => {
              const maxVotesRef = sceneContext.dataRef
                .child('settings')
                .child('maxVotes')
              const maxVotesState = useFirebaseDatabase(maxVotesRef)
              const maxVotes =
                maxVotesState.unstable_read() || DEFAULT_MAX_VOTES
              return (
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
              )
            })}
          </Box>
          <Box flex={false}>
            {λ(() => {
              const enabledRef = sceneContext.dataRef
                .child('settings')
                .child('enabled')
              const enabledState = useFirebaseDatabase(enabledRef)
              const enabled = enabledState.unstable_read()
              return (
                <ActionCheckbox
                  checked={enabled}
                  toggle
                  label={`Enabled`}
                  description="toggle voting"
                  onChange={async () => {
                    await enabledRef.set(!enabled)
                  }}
                />
              )
            })}
          </Box>
        </Box>
      </BackstageSection>
      <BackstageSection title="Vote results">
        {λ(() => {
          const showResultsRef = sceneContext.dataRef
            .child('settings')
            .child('showResults')
          const showResultsState = useFirebaseDatabase(showResultsRef)
          const showResults = showResultsState.unstable_read()
          return (
            <ActionCheckbox
              checked={showResults}
              toggle
              label={`Show results`}
              description="toggle result visibility"
              onChange={async () => {
                await showResultsRef.set(!showResults)
              }}
            />
          )
        })}
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

function VotePresentation() {
  const sceneContext = useSceneContext()
  const [voteOptionsText, setVoteOptionsText] = useState<string | null>(null)

  const optionsRef = sceneContext.dataRef.child('options')
  const optionsState = useFirebaseDatabase(optionsRef)
  const options = optionsState.unstable_read()

  const showResultsRef = sceneContext.dataRef
    .child('settings')
    .child('showResults')
  const showResultsState = useFirebaseDatabase(showResultsRef)
  const showResults = showResultsState.unstable_read()

  if (!showResults) {
    return (
      <Box fill align="center" justify="center">
        <Text
          alignSelf="center"
          textAlign="center"
          size="64px"
          weight="bold"
          color="accent-1"
        >
          Please vote @ qz.netlify.com
        </Text>
        <Text alignSelf="center" textAlign="center" size="64px">
          {λ(() => {
            const allVotesRef = sceneContext.dataRef.child('votes')
            const allVotesState = useFirebaseDatabase(allVotesRef)
            const votesPerUser = firebaseToEntries(
              allVotesState.unstable_read()
            ).map(
              entry =>
                firebaseToEntries(entry.val).filter(voteEntry => voteEntry.val)
                  .length
            )
            const numberOfPeople = votesPerUser.length
            const numberOfVotes = votesPerUser.reduce((a, b) => a + b, 0)
            return (
              <span>
                {numberOfVotes} vote{numberOfVotes === 1 ? '' : 's'} from{' '}
                {numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'}
              </span>
            )
          })}
        </Text>
      </Box>
    )
  }

  return (
    <Box fill>
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
          <Box fill>
            <Box pad="medium" background="dark-1" flex={false}>
              <Text alignSelf="center" textAlign="center" size="64px">
                Voting Results
              </Text>
            </Box>
            <Box
              flex
              pad="small"
              style={{ fontSize: '56px', lineHeight: '72px' }}
            >
              {voteResult.map(entry => {
                return (
                  <Box direction="row" pad="small">
                    <Box flex>{entry.optionText}</Box>
                    <Box style={{ textAlign: 'right' }}>{entry.voteCount}</Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
