import { test } from '@playwright/test'
import { AppTester } from '../lib/AppTester'

test('complete vote flow: admin creates vote, audience participates', async ({
  context,
}) => {
  const app = new AppTester(context)

  // Create users (all using shared namespace)
  const [admin, user1, user2] = await Promise.all([
    app.createAdmin('admin-user', 'Admin User'),
    app.createAudience('user-1', 'Alice'),
    app.createAudience('user-2', 'Bob'),
  ])

  // Admin: Create a vote scene
  const screenId = await admin.createVoteScene()

  // Admin: Configure the vote
  await admin.vote.expectVoteScene()

  const questionText = 'What is your favorite programming language?'
  const voteOptions = ['JavaScript', 'TypeScript', 'Python', 'Go']

  await admin.vote.setQuestionText(questionText)
  await admin.vote.setVoteOptions(voteOptions)

  // Admin: Activate the scene so audience can see it
  await admin.activateScene(screenId)

  // Admin: Enable voting
  await admin.vote.enableVoting()

  // Audience users navigate to voting interface
  await user1.navigateToAudience()
  await user2.navigateToAudience()

  // Audience: Verify voting interface is displayed
  await user1.vote.expectVotingInterface(questionText)
  await user1.vote.expectVotingOptions(voteOptions)

  await user2.vote.expectVotingInterface(questionText)
  await user2.vote.expectVotingOptions(voteOptions)

  // Audience: Cast votes
  await user1.vote.selectOption('TypeScript')
  await user2.vote.selectOption('JavaScript')

  // Verify votes were recorded
  await user1.vote.expectVoteSubmitted()
  await user2.vote.expectVoteSubmitted()

  // Admin: Check vote results
  await admin.vote.expectResults({
    TypeScript: 1,
    JavaScript: 1,
    Python: 0,
    Go: 0,
  })
})
