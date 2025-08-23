import { test } from '@playwright/test'
import { AppTester } from '../lib/AppTester'

test('complete quiz flow: admin imports questions, audience answers, presentation displays results and leaderboard', async ({
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

  await test.step('Setup: Admin creates quiz scene and imports expert questions', async () => {
    // Admin: Create a quiz scene
    const screenId = await admin.createQuizScene()
    await admin.quiz.expectQuizScene()

    // Admin: Import expert-level quiz questions (teaching valuable concepts)
    const expertQuizTOML = `
[[questions]]
text = "**JavaScript Closures**: What does this function return? \`((x) => (y) => x + y)(5)(3)\`"
answers = [
  { text = "8", correct = true },
  { text = "53" },
  { text = "undefined" },
  { text = "Function" }
]

[[questions]]
text = "**CSS Grid**: Which property creates implicit grid tracks when items are placed outside the explicit grid?"
answers = [
  { text = "grid-auto-columns", correct = true },
  { text = "grid-template-columns" },
  { text = "grid-column-gap" },
  { text = "grid-auto-flow" }
]

[[questions]]
text = "**Database ACID**: Which property ensures that either all operations in a transaction succeed or all fail?"
answers = [
  { text = "Atomicity", correct = true },
  { text = "Consistency" },
  { text = "Isolation" },
  { text = "Durability" }
]

[[questions]]
text = "**Time Complexity**: What's the average time complexity of HashMap/Dictionary lookup operations?"
answers = [
  { text = "O(1)", correct = true },
  { text = "O(log n)" },
  { text = "O(n)" },
  { text = "O(n log n)" }
]
`

    await admin.quiz.importQuestions(expertQuizTOML)

    // Admin: Activate the scene so others can see it
    await admin.activateScene(screenId)

    // Presentation: Navigate to display view
    await presentation.navigateToDisplay()
    await presentation.quiz.expectNoActiveQuestion()

    // Audience: Navigate to audience view
    await user1.navigateToAudience()
    await user2.navigateToAudience()

    await user1.quiz.expectWaitingForQuestion()
    await user2.quiz.expectWaitingForQuestion()
  })

  await test.step('Question 1: JavaScript Closures (Alice=100, Bob=99)', async () => {
    await admin.quiz.activateQuestion('question001')

    // Presentation: Should show the question
    await presentation.quiz.expectQuestionInterface('JavaScript Closures')
    await presentation.quiz.expectAnswersNotRevealed()

    // Audience: Should see the question and answer choices
    await user1.quiz.expectQuestionInterface('question001')
    await user2.quiz.expectQuestionInterface('question001')

    // Audience: Alice answers correctly first (gets 100 points), Bob answers correctly second (gets 99 points)
    await user1.quiz.selectAnswer('A') // Correct answer: 8
    await user1.quiz.expectAnswerSubmitted()

    await user2.quiz.selectAnswer('A') // Also correct, but slower
    await user2.quiz.expectAnswerSubmitted()

    // Admin: Check answer counts
    await admin.quiz.expectQuestionAnswerCount('question001', 2, 2)

    // Admin: Reveal answer
    await admin.quiz.revealAnswer()

    // Presentation: Should show revealed answers
    await presentation.quiz.expectAnswerRevealed()

    // Audience: Should see answer revealed
    await user1.quiz.expectAnswerRevealed('question001')
    await user2.quiz.expectAnswerRevealed('question001')

    // Admin: Grade this question to calculate scores
    await admin.quiz.gradeQuestion('question001')

    // Presentation: Should show leaderboard with current scores
    await presentation.quiz.expectLeaderboardScores({
      Alice: 100,
      Bob: 99,
    })
  })

  await test.step('Question 2: CSS Grid (Alice=0, Bob=100)', async () => {
    await admin.quiz.activateQuestion('question002')

    await presentation.quiz.expectQuestionInterface('CSS Grid')
    await user1.quiz.expectQuestionInterface('question002')
    await user2.quiz.expectQuestionInterface('question002')

    // Bob answers correctly first this time, Alice incorrectly
    await user2.quiz.selectAnswer('A') // Correct: grid-auto-columns
    await user1.quiz.selectAnswer('B') // Incorrect: grid-template-columns

    await user1.quiz.expectAnswerSubmitted()
    await user2.quiz.expectAnswerSubmitted()

    await admin.quiz.expectQuestionAnswerCount('question002', 2, 1)
    await admin.quiz.revealAnswer()

    // Admin: Grade this question
    await admin.quiz.gradeQuestion('question002')

    // Presentation: Should show updated leaderboard
    await presentation.quiz.expectLeaderboardScores({
      Alice: 100, // Still 100 from Q1
      Bob: 199, // 99 from Q1 + 100 from Q2
    })
  })

  await test.step('Question 3: Database ACID (Alice=100, Bob=99)', async () => {
    await admin.quiz.activateQuestion('question003')

    await presentation.quiz.expectQuestionInterface('Database ACID')

    // Both answer correctly, Alice first again
    await user1.quiz.selectAnswer('A') // Correct: Atomicity
    await user2.quiz.selectAnswer('A') // Also correct
    await admin.quiz.expectQuestionAnswerCount('question003', 2, 2)

    await admin.quiz.revealAnswer()

    // Admin: Grade this question
    await admin.quiz.gradeQuestion('question003')

    // Presentation: Should show updated leaderboard
    await presentation.quiz.expectLeaderboardScores({
      Alice: 200, // 100 + 0 + 100
      Bob: 298, // 99 + 100 + 99
    })
  })

  await test.step('Question 4: Time Complexity (Alice=0, Bob=100)', async () => {
    await admin.quiz.activateQuestion('question004')

    await presentation.quiz.expectQuestionInterface('Time Complexity')

    // Alice answers incorrectly, Bob correctly
    await user1.quiz.selectAnswer('B') // Incorrect: O(log n)
    await user2.quiz.selectAnswer('A') // Correct: O(1)
    await admin.quiz.expectQuestionAnswerCount('question004', 2, 1)
    await admin.quiz.revealAnswer()

    // Admin: Grade this question
    await admin.quiz.gradeQuestion('question004')

    // Presentation: Should show final leaderboard
    await presentation.quiz.expectLeaderboardScores({
      Alice: 200, // 100 + 0 + 100 + 0
      Bob: 398, // 99 + 100 + 99 + 100
    })
  })
})
