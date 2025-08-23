import { Page, expect } from '@playwright/test'
import { GrommetCheckbox } from './GrommetCheckbox'

export class QuizAdminTester {
  constructor(private page: Page) {}

  async importQuestions(tomlContent: string): Promise<void> {
    // Find and fill the TOML import textarea
    await this.page
      .getByRole('region', { name: 'Import questions' })
      .getByRole('textbox')
      .fill(tomlContent)

    // Click the import button
    await this.page
      .getByRole('region', { name: 'Import questions' })
      .getByRole('button', { name: 'Import' })
      .click()
  }

  async activateQuestion(questionId: string): Promise<void> {
    // Find the row for this question and click the activate button
    const questionRow = this.page.getByRole('row', {
      name: new RegExp(questionId),
    })
    await questionRow.getByRole('button', { name: 'activate' }).click()

    // Verify the question is now active
    await expect(questionRow.getByText('Active')).toBeVisible()
  }

  async revealAnswer(): Promise<void> {
    // Toggle the "Reveal answer" checkbox
    const revealCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: 'Reveal answer' })
    )
    await revealCheckbox.check()
  }

  async hideAnswer(): Promise<void> {
    // Uncheck the "Reveal answer" checkbox
    const revealCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: 'Reveal answer' })
    )
    await revealCheckbox.uncheck()
  }

  async gradeQuestion(questionId: string): Promise<void> {
    // Find the row for this question and click the grade button
    const questionRow = this.page.getByRole('row', {
      name: new RegExp(questionId),
    })
    await questionRow.getByRole('button', { name: 'grade' }).click()
  }


  async expectQuizScene(): Promise<void> {
    // Verify we're in a quiz scene by checking for quiz-specific elements
    await expect(
      this.page.getByRole('region', { name: 'Questions', exact: true })
    ).toBeVisible()
    await expect(
      this.page.getByRole('region', { name: 'Import questions' })
    ).toBeVisible()
    await expect(
      this.page.getByRole('region', { name: 'Leaderboard' })
    ).toBeVisible()
  }

  async expectLeaderboard(
    expectedScores: Record<string, number>
  ): Promise<void> {
    // Check the leaderboard shows expected scores
    const leaderboardRegion = this.page.getByRole('region', {
      name: 'Leaderboard',
    })

    for (const [userName, score] of Object.entries(expectedScores)) {
      // Look for a row containing both the user name and score
      await expect(
        leaderboardRegion.getByRole('row', {
          name: new RegExp(`${userName}.*${score}`),
        })
      ).toBeVisible()
    }
  }

  async expectQuestionAnswerCount(
    questionId: string,
    totalAnswers: number,
    correctAnswers: number
  ): Promise<void> {
    // Verify answer counts for a specific question
    const questionRow = this.page.getByRole('row', {
      name: new RegExp(questionId),
    })
    const expectedText = `${totalAnswers} (${correctAnswers} correct)`
    await expect(questionRow.getByText(expectedText)).toBeVisible()
  }
}
