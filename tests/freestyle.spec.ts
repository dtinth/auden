import { expect, test } from '@playwright/test'
import { AppTester } from './lib/AppTester'

// Absolutely hilarious question constants
const ALICE_Q1 =
  'If two developers try to update the same Firebase Realtime Database node at the exact nanosecond, does Firebase resolve the conflict with a dance-off or a quantum coin flip? And what’s the best way to design collaborative features so users don’t accidentally create a Schrödinger’s document?'
const ALICE_Q2 =
  'When integrating Firebase with third-party identity providers, how do you prevent someone from authenticating as “admin@evil.com” and taking over the app? Is there a secret Firebase handshake, or do we just trust the OAuth fairy?'
const BOB_Q1 =
  'If Playwright simulates 100 users all clicking “Submit” at once, will Firebase melt, or will the app achieve sentience and start writing its own tests? How do you reliably test real-time race conditions without summoning the chaos gods?'
const BOB_Q2 =
  'Is the Firebase Emulator Suite secretly powered by hamsters on tiny treadmills, and what happens when you try to run reproducible CI tests with data isolation—do the hamsters unionize, or is there a best practice for keeping your test data from escaping into production?'

test('complete freestyle flow: admin configures scene, audience interacts, presentation displays content', async ({
  context,
}) => {
  const app = new AppTester(context)

  // Create users (all using shared namespace)
  const [admin, alice, bob, presentation] = await Promise.all([
    app.createAdmin(),
    app.createAudience('alice'),
    app.createAudience('bob'),
    app.createPresentation(),
  ])

  await test.step('Setup: Admin creates freestyle scene and configures display modes', async () => {
    // Admin: Create a freestyle scene
    const screenId = await admin.createFreestyleScene()
    await admin.freestyle.expectFreestyleScene()

    // Admin: Activate the scene so others can see it
    await admin.activateScene(screenId)

    // Presentation: Navigate to display view
    await presentation.navigateToDisplay()
    await presentation.freestyle.expectDisplayReady()

    // Audience: Navigate to audience view
    await alice.navigateToAudience()
    await bob.navigateToAudience()
  })

  await test.step('Custom HTML/CSS Content: Admin injects content, audience and presentation display it', async () => {
    // Admin: Set custom HTML content for presentation
    await admin.freestyle.setPresentationHTML(
      '<h1 id="custom-title">Welcome to Code in the Dark!</h1>'
    )
    await admin.freestyle.setPresentationCSS(
      '#custom-title { color: #ff6b35; font-family: monospace; text-align: center; }'
    )

    // Presentation: Should display custom content
    await presentation.freestyle.expectCustomContent(
      'Welcome to Code in the Dark!'
    )

    // Admin: Set custom HTML content for audience (different from presentation)
    await admin.freestyle.setAudienceHTML(
      '<p id="audience-msg">Audience: Ready to participate?</p>'
    )
    await admin.freestyle.setAudienceCSS(
      '#audience-msg { color: #4ecdc4; font-weight: bold; }'
    )

    // Audience: Should display their custom content (in arbitrary mode by default)
    await alice.freestyle.expectArbitraryMode()
    await alice.freestyle.expectCustomContent('Audience: Ready to participate?')
    await bob.freestyle.expectCustomContent('Audience: Ready to participate?')
  })

  await test.step('Chat Functionality: Admin enables chat, users send messages, presentation shows chat', async () => {
    // Admin: Switch audience to chat mode and enable chat on presentation
    await admin.freestyle.setAudienceDisplayMode('chat')
    await admin.freestyle.enablePresentationChat()

    // Verify chat interfaces are available
    await alice.freestyle.expectChatMode()
    await bob.freestyle.expectChatMode()
    await presentation.freestyle.expectChatVisible()

    // Users: Send chat messages
    await alice.freestyle.sendChatMessage('Hello from Alice! 👋')
    await bob.freestyle.sendChatMessage('Bob here, ready for some coding!')

    // Verify messages appear in real-time for all participants
    await alice.freestyle.expectChatMessage('Alice', 'Hello from Alice! 👋')
    await alice.freestyle.expectChatMessage(
      'Bob',
      'Bob here, ready for some coding!'
    )

    await bob.freestyle.expectChatMessage('Alice', 'Hello from Alice! 👋')
    await bob.freestyle.expectChatMessage(
      'Bob',
      'Bob here, ready for some coding!'
    )

    // Presentation: Should show chat messages
    await presentation.freestyle.expectChatMessage(
      'Alice',
      'Hello from Alice! 👋'
    )
    await presentation.freestyle.expectChatMessage(
      'Bob',
      'Bob here, ready for some coding!'
    )
  })

  await test.step('Questions System: Users submit questions, vote on them, admin sees top questions', async () => {
    // Admin: Switch audience to questions mode
    await admin.freestyle.setAudienceDisplayMode('questions')

    // Verify questions interfaces are available
    await alice.freestyle.expectQuestionsMode()
    await bob.freestyle.expectQuestionsMode()

    // Users: Submit absolutely hilarious questions (each user submits 2 questions)
    await alice.freestyle.submitQuestion(ALICE_Q1)
    await alice.freestyle.submitQuestion(ALICE_Q2)
    await bob.freestyle.submitQuestion(BOB_Q1)
    await bob.freestyle.submitQuestion(BOB_Q2)

    // Verify all hilarious questions appear for both users
    await alice.freestyle.expectQuestion('Alice', ALICE_Q1)
    await alice.freestyle.expectQuestion('Alice', ALICE_Q2)
    await alice.freestyle.expectQuestion('Bob', BOB_Q1)
    await alice.freestyle.expectQuestion('Bob', BOB_Q2)

    await bob.freestyle.expectQuestion('Alice', ALICE_Q1)
    await bob.freestyle.expectQuestion('Alice', ALICE_Q2)
    await bob.freestyle.expectQuestion('Bob', BOB_Q1)
    await bob.freestyle.expectQuestion('Bob', BOB_Q2)

    // Cross-voting: Users vote on each other's hilarious questions (avoid self-voting to prevent unliking)
    // Alice votes on 1 of Bob's questions
    await alice.freestyle.likeQuestion(BOB_Q1)

    // Bob votes on both of Alice's questions
    await bob.freestyle.likeQuestion(ALICE_Q1)
    await bob.freestyle.likeQuestion(ALICE_Q2)

    // Expected like counts after voting:
    // - ALICE_Q1: 2 likes (Alice's auto-like + Bob's like)
    // - ALICE_Q2: 2 likes (Alice's auto-like + Bob's like)
    // - BOB_Q1: 2 likes (Bob's auto-like + Alice's like)
    // - BOB_Q2: 1 like (only Bob's auto-like, no one else voted)

    // Wait and verify like counts (different numbers!)
    await alice.freestyle.expectQuestionLikes(ALICE_Q1, 2)
    await alice.freestyle.expectQuestionLikes(ALICE_Q2, 2)
    await alice.freestyle.expectQuestionLikes(BOB_Q1, 2)
    await alice.freestyle.expectQuestionLikes(BOB_Q2, 1)

    // Switch to Top Questions view and verify all questions are present
    await alice.freestyle.switchToTopQuestions()

    // Verify all 4 questions are present (no specific order assertion since all have same like count)
    const questionItems = alice.page.getByTestId('question')
    await expect(questionItems).toHaveCount(4, { timeout: 5000 })

    // Verify all hilarious questions are visible with their correct like counts
    await alice.freestyle.expectQuestion('Alice', ALICE_Q1)
    await alice.freestyle.expectQuestion('Alice', ALICE_Q2)
    await alice.freestyle.expectQuestion('Bob', BOB_Q1)
    await alice.freestyle.expectQuestion('Bob', BOB_Q2)
  })

  await test.step('Both Mode: Admin enables both chat and questions, users can switch between them', async () => {
    // Admin: Set audience display mode to "both"
    await admin.freestyle.setAudienceDisplayMode('both')

    // Users: Should see both interface with mode switcher
    await alice.freestyle.expectBothMode()
    await bob.freestyle.expectBothMode()

    // Users: Switch to chat mode within "both"
    await alice.freestyle.switchToChatInBothMode()
    await bob.freestyle.switchToChatInBothMode()

    // Send new messages in both mode
    await alice.freestyle.sendChatMessage('Now in both mode - chat works!')
    await bob.freestyle.sendChatMessage('Questions and chat together!')

    // Presentation should still show all chat messages
    await presentation.freestyle.expectChatMessage(
      'Alice',
      'Now in both mode - chat works!'
    )
    await presentation.freestyle.expectChatMessage(
      'Bob',
      'Questions and chat together!'
    )

    // Users: Switch to questions mode within "both"
    await alice.freestyle.switchToQuestionsInBothMode()
    await bob.freestyle.switchToQuestionsInBothMode()

    // Submit additional questions in both mode
    const ALICE_Q3 =
      'Can we use both features simultaneously while my code pretends to work?'
    await alice.freestyle.submitQuestion(ALICE_Q3)

    // Verify the new question appears
    await alice.freestyle.expectQuestion('Alice', ALICE_Q3)
    await bob.freestyle.expectQuestion('Alice', ALICE_Q3)
  })

  await test.step('Scene switching: Admin changes content, real-time updates across all views', async () => {
    // Admin: Disable chat on presentation and update custom content
    await admin.freestyle.disablePresentationChat()
    await admin.freestyle.setPresentationHTML(
      '<div id="final-msg">Thanks for participating in Freestyle mode!</div>'
    )
    await admin.freestyle.setPresentationCSS(
      '#final-msg { font-size: 2em; color: #95e1d3; text-align: center; padding: 50px; }'
    )

    // Presentation: Chat should be hidden, new content should appear
    await presentation.freestyle.expectChatHidden()
    await presentation.freestyle.expectCustomContent(
      'Thanks for participating in Freestyle mode!'
    )

    // Admin: Switch audience back to arbitrary mode with final message
    await admin.freestyle.setAudienceDisplayMode('arbitrary')
    await admin.freestyle.setAudienceHTML(
      '<p id="thanks">Thank you Alice and Bob for the great questions and chat!</p>'
    )

    // Audience: Should see final arbitrary content
    await alice.freestyle.expectArbitraryMode()
    await alice.freestyle.expectCustomContent(
      'Thank you Alice and Bob for the great questions and chat!'
    )
    await bob.freestyle.expectCustomContent(
      'Thank you Alice and Bob for the great questions and chat!'
    )
  })
})

test('freestyle real-time synchronization: immediate updates across all user types', async ({
  context,
}) => {
  const app = new AppTester(context)

  const [admin, audience, presentation] = await Promise.all([
    app.createAdmin(),
    app.createAudience('alice'),
    app.createPresentation(),
  ])

  await test.step('Setup freestyle scene', async () => {
    const screenId = await admin.createFreestyleScene()
    await admin.activateScene(screenId)
    await presentation.navigateToDisplay()
    await audience.navigateToAudience()
  })

  await test.step('Real-time content updates', async () => {
    // Admin updates presentation content
    await admin.freestyle.setPresentationHTML('<h2>Real-time Test</h2>')

    // Presentation should immediately show the update
    await presentation.freestyle.waitForCustomContentUpdate('Real-time Test')

    // Admin switches audience to chat mode
    await admin.freestyle.setAudienceDisplayMode('chat')
    await admin.freestyle.enablePresentationChat()

    // Audience sends message
    await audience.freestyle.sendChatMessage('Testing real-time sync!')

    // Presentation should immediately show the message
    await presentation.freestyle.waitForChatMessage(
      'Alice',
      'Testing real-time sync!'
    )
  })
})
