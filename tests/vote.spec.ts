import { test } from '@playwright/test'
import { AppTester } from './lib/AppTester'

test('complete vote flow: admin creates vote, audience participates, presentation displays results', async ({
  context,
}) => {
  const app = new AppTester(context)

  // Create users (all using shared namespace)
  const [admin, user1, user2, presentation] = await Promise.all([
    app.createAdmin(),
    app.createAudience('alice'),
    app.createAudience('bob'),
    app.createPresentation(),
  ])

  // Admin: Create a vote scene
  const screenId = await admin.createVoteScene()

  // Admin: Configure the vote
  await admin.vote.expectVoteScene()

  const questionText = 'What is your favorite programming language?'
  const voteOptions = ['JavaScript', 'TypeScript', 'Python', 'Go']

  await admin.vote.setQuestionText(questionText)
  await admin.vote.setVoteOptions(voteOptions)
  await app.screenshot(admin, 'vote-admin-setup')

  // Admin: Activate the scene so audience can see it
  await admin.activateScene(screenId)

  // Presentation: Navigate to display view
  await presentation.navigateToDisplay()

  // Presentation: Initially results should be hidden, showing voting prompt
  await presentation.vote.expectResultsHidden()
  await presentation.vote.expectVotingPrompt()
  await presentation.vote.expectVoteCount({ votes: 0, people: 0 })

  // Admin: Enable voting
  await admin.vote.enableVoting()

  // Audience users navigate to voting interface
  await user1.navigateToAudience()
  await user2.navigateToAudience()

  // Audience: Verify voting interface is displayed
  await user1.vote.expectVotingInterface(questionText)
  await user1.vote.expectVotingOptions(voteOptions)
  await app.screenshot(user1, 'vote-alice-mobile-voting')

  await user2.vote.expectVotingInterface(questionText)
  await user2.vote.expectVotingOptions(voteOptions)
  await app.screenshot(user2, 'vote-bob-mobile-voting')

  // Audience: Cast votes
  await user1.vote.selectOption('TypeScript')
  await user2.vote.selectOption('JavaScript')
  await app.screenshot(user1, 'vote-alice-voted')

  // Verify votes were recorded
  await user1.vote.expectVoteSubmitted()
  await user2.vote.expectVoteSubmitted()

  // Presentation: Vote count should update to show 2 votes from 2 people
  await presentation.vote.expectVoteCount({ votes: 2, people: 2 })

  // Admin: Check vote results
  await admin.vote.expectResults({
    TypeScript: 1,
    JavaScript: 1,
    Python: 0,
    Go: 0,
  })

  // Admin: Enable results display
  await admin.vote.showResults()

  // Presentation: Should now show the voting results
  await presentation.vote.expectResults({
    TypeScript: 1,
    JavaScript: 1,
    Python: 0,
    Go: 0,
  })
  await app.screenshot(presentation, 'vote-presentation-results')
})
