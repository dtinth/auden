import { Page, expect } from '@playwright/test'

export class QuizPresentationTester {
  constructor(private readonly page: Page) {}

  async expectNoActiveQuestion(): Promise<void> {
    // When no question is active, should show the default message
    await expect(this.page.getByText('No active question...')).toBeVisible()
  }

  async expectQuestionDisplay(questionText: string): Promise<void> {
    // Should display the question text prominently
    // Note: question text is rendered as HTML, so we use a partial match
    await expect(this.page.getByText(questionText, { exact: false })).toBeVisible()
  }

  async expectAnswerChoices(): Promise<void> {
    // Should show answer choice boxes A, B, C, D
    await expect(this.page.getByTestId('quiz-answer-A')).toBeVisible()
    await expect(this.page.getByTestId('quiz-answer-B')).toBeVisible()
  }

  async expectAnswerRevealed(): Promise<void> {
    // When answer is revealed, should have correct/incorrect states
    const correctAnswers = this.page.locator('[data-testid^="quiz-answer-"][data-state="correct"]')
    const incorrectAnswers = this.page.locator('[data-testid^="quiz-answer-"][data-state="incorrect"]')
    
    // Should have at least one correct answer
    await expect(correctAnswers.first()).toBeVisible()
    // May or may not have incorrect answers, but if present, they should be visible too
    const incorrectCount = await incorrectAnswers.count()
    if (incorrectCount > 0) {
      await expect(incorrectAnswers.first()).toBeVisible()
    }
  }

  async expectAnswersNotRevealed(): Promise<void> {
    // When answers are not revealed, all should be in 'unrevealed' state
    const unrevealedAnswers = this.page.locator('[data-testid^="quiz-answer-"][data-state="unrevealed"]')
    await expect(unrevealedAnswers.first()).toBeVisible()
    
    // Should not have any revealed states
    const revealedAnswers = this.page.locator('[data-testid^="quiz-answer-"][data-state="correct"], [data-testid^="quiz-answer-"][data-state="incorrect"]')
    await expect(revealedAnswers).toHaveCount(0)
  }

  async expectLeaderboardDisplay(): Promise<void> {
    // When showing leaderboard, should display user rankings and scores
    await expect(this.page.getByText('Leaderboard', { exact: false })).toBeVisible()
  }

  async expectLeaderboardHidden(): Promise<void> {
    // When leaderboard is hidden, should not show leaderboard content
    await expect(this.page.getByText('Leaderboard', { exact: false })).not.toBeVisible()
  }

  async expectLeaderboardScores(expectedScores: Record<string, number>): Promise<void> {
    // Verify specific scores appear in the leaderboard
    await this.expectLeaderboardDisplay()
    
    for (const [userName, score] of Object.entries(expectedScores)) {
      // Look for the user name and score in the leaderboard
      await expect(this.page.getByText(userName)).toBeVisible()
      await expect(this.page.getByText(score.toString())).toBeVisible()
    }
  }

  async expectQuestionInterface(questionText: string): Promise<void> {
    // Complete question interface should be visible
    await this.expectQuestionDisplay(questionText)
    await this.expectAnswerChoices()
  }
}