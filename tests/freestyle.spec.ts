import { expect, test } from '@playwright/test'
import { AppTester } from './lib/AppTester'

test('complete freestyle flow: admin configures scene, audience interacts, presentation displays content', async ({
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
    await user1.navigateToAudience()
    await user2.navigateToAudience()
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
    await user1.freestyle.expectArbitraryMode()
    await user1.freestyle.expectCustomContent('Audience: Ready to participate?')
    await user2.freestyle.expectCustomContent('Audience: Ready to participate?')
  })

  await test.step('Chat Functionality: Admin enables chat, users send messages, presentation shows chat', async () => {
    // Admin: Switch audience to chat mode and enable chat on presentation
    await admin.freestyle.setAudienceDisplayMode('chat')
    await admin.freestyle.enablePresentationChat()

    // Verify chat interfaces are available
    await user1.freestyle.expectChatMode()
    await user2.freestyle.expectChatMode()
    await presentation.freestyle.expectChatVisible()

    // Users: Send chat messages
    await user1.freestyle.sendChatMessage('Hello from Alice! 👋')
    await user2.freestyle.sendChatMessage('Bob here, ready for some coding!')

    // Verify messages appear in real-time for all participants
    await user1.freestyle.expectChatMessage('Alice', 'Hello from Alice! 👋')
    await user1.freestyle.expectChatMessage(
      'Bob',
      'Bob here, ready for some coding!'
    )

    await user2.freestyle.expectChatMessage('Alice', 'Hello from Alice! 👋')
    await user2.freestyle.expectChatMessage(
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
    await user1.freestyle.expectQuestionsMode()
    await user2.freestyle.expectQuestionsMode()

    // Users: Submit questions
    await user1.freestyle.submitQuestion(
      'What IDE should I use for JavaScript development?'
    )
    await user2.freestyle.submitQuestion(
      'How do I handle async operations in TypeScript?'
    )

    // Verify questions appear
    await user1.freestyle.expectQuestion(
      'Alice',
      'What IDE should I use for JavaScript development?'
    )
    await user1.freestyle.expectQuestion(
      'Bob',
      'How do I handle async operations in TypeScript?'
    )
    await user2.freestyle.expectQuestion(
      'Alice',
      'What IDE should I use for JavaScript development?'
    )
    await user2.freestyle.expectQuestion(
      'Bob',
      'How do I handle async operations in TypeScript?'
    )

    // Cross-voting: Users vote on each other's questions
    await user1.freestyle.likeQuestion(
      'How do I handle async operations in TypeScript?'
    )
    await user2.freestyle.likeQuestion(
      'What IDE should I use for JavaScript development?'
    )
    await user2.freestyle.likeQuestion(
      'How do I handle async operations in TypeScript?'
    ) // Bob likes his own question

    // Verify like counts
    await user1.freestyle.expectQuestionLikes(
      'What IDE should I use for JavaScript development?',
      1
    )
    await user1.freestyle.expectQuestionLikes(
      'How do I handle async operations in TypeScript?',
      2
    )

    // Switch to Top Questions view and verify order
    await user1.freestyle.switchToTopQuestions()

    // Verify explicit ordering: Bob's question (2 likes) should be first, Alice's (1 like) second
    const questionItems = user1.page.getByTestId('question')
    await expect(questionItems).toHaveCount(2, { timeout: 5000 })

    // First item should be Bob's question with higher likes
    const firstQuestion = questionItems.nth(0)
    await expect(firstQuestion).toContainText('Bob', { timeout: 5000 })
    await expect(firstQuestion).toContainText(
      'How do I handle async operations in TypeScript?'
    )

    // Second item should be Alice's question with lower likes
    const secondQuestion = questionItems.nth(1)
    await expect(secondQuestion).toContainText('Alice', { timeout: 5000 })
    await expect(secondQuestion).toContainText(
      'What IDE should I use for JavaScript development?'
    )
  })

  await test.step('Both Mode: Admin enables both chat and questions, users can switch between them', async () => {
    // Admin: Set audience display mode to "both"
    await admin.freestyle.setAudienceDisplayMode('both')

    // Users: Should see both interface with mode switcher
    await user1.freestyle.expectBothMode()
    await user2.freestyle.expectBothMode()

    // Users: Switch to chat mode within "both"
    await user1.freestyle.switchToChatInBothMode()
    await user2.freestyle.switchToChatInBothMode()

    // Send new messages in both mode
    await user1.freestyle.sendChatMessage('Now in both mode - chat works!')
    await user2.freestyle.sendChatMessage('Questions and chat together!')

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
    await user1.freestyle.switchToQuestionsInBothMode()
    await user2.freestyle.switchToQuestionsInBothMode()

    // Submit additional questions in both mode
    await user1.freestyle.submitQuestion(
      'Can we use both features simultaneously?'
    )

    // Verify the new question appears
    await user1.freestyle.expectQuestion(
      'Alice',
      'Can we use both features simultaneously?'
    )
    await user2.freestyle.expectQuestion(
      'Alice',
      'Can we use both features simultaneously?'
    )
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
    await user1.freestyle.expectArbitraryMode()
    await user1.freestyle.expectCustomContent(
      'Thank you Alice and Bob for the great questions and chat!'
    )
    await user2.freestyle.expectCustomContent(
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
