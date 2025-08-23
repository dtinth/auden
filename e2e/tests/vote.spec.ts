import { test } from '@playwright/test'
import { AppTester } from '../lib/AppTester'
import { VoteAdminTester } from '../lib/VoteAdminTester'
import { VoteAudienceTester } from '../lib/VoteAudienceTester'

test('complete vote flow: admin creates vote, audience participates', async ({
  context,
}) => {
  const app = new AppTester(context)

  // Create users (all using shared namespace)
  const admin = await app.createAdmin('admin-user', 'Admin User')
  const user1 = await app.createAudience('user-1', 'Alice')
  const user2 = await app.createAudience('user-2', 'Bob')

  // Admin: Create a vote scene
  const screenId = await admin.createVoteScene()

  // Admin: Configure the vote
  const voteAdmin = new VoteAdminTester(admin.page)
  await voteAdmin.expectVoteScene()

  const questionText = 'What is your favorite programming language?'
  const voteOptions = ['JavaScript', 'TypeScript', 'Python', 'Go']

  await voteAdmin.setQuestionText(questionText)
  await voteAdmin.setVoteOptions(voteOptions)

  // Admin: Activate the scene so audience can see it
  await admin.activateScene(screenId)

  // Admin: Enable voting
  await voteAdmin.enableVoting()

  // Audience users navigate to voting interface
  await user1.navigateToAudience()
  await user2.navigateToAudience()

  // Create vote audience testers
  const voteUser1 = new VoteAudienceTester(user1.page)
  const voteUser2 = new VoteAudienceTester(user2.page)

  // Audience: Verify voting interface is displayed
  await voteUser1.expectVotingInterface(questionText)
  await voteUser1.expectVotingOptions(voteOptions)

  await voteUser2.expectVotingInterface(questionText)
  await voteUser2.expectVotingOptions(voteOptions)

  // Audience: Cast votes
  await voteUser1.selectOption('TypeScript')
  await voteUser2.selectOption('JavaScript')

  // Verify votes were recorded
  await voteUser1.expectVoteSubmitted()
  await voteUser2.expectVoteSubmitted()

  // Admin: Check vote results
  await voteAdmin.expectResults({
    TypeScript: 1,
    JavaScript: 1,
    Python: 0,
    Go: 0,
  })
})
