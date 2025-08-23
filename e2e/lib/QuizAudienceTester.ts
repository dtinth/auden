import { Page, expect } from '@playwright/test'

export class QuizAudienceTester {
  constructor(private readonly page: Page) {}

  async expectWaitingForQuestion(): Promise<void> {
    // When no question is active, should show waiting message
    await expect(this.page.getByText('Wait for a question!')).toBeVisible()
  }

  async expectQuestionActive(questionId: string): Promise<void> {
    // When a question is active, should show the question ID/text
    await expect(this.page.getByText(questionId)).toBeVisible()
  }

  async expectAnswerChoices(): Promise<void> {
    // Should show answer choice buttons A, B, C, D
    await expect(this.page.getByRole('button', { name: 'A' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'B' })).toBeVisible()
  }

  async selectAnswer(choice: 'A' | 'B' | 'C' | 'D'): Promise<void> {
    // Click the specified answer choice
    await this.page.getByRole('button', { name: choice }).click()
  }

  async expectAnswerSubmitted(): Promise<void> {
    // After answering, should show "Answered! Wait for result..." message
    await expect(this.page.getByText('Answered! Wait for result...')).toBeVisible()
  }

  async expectAnswerRevealed(questionId: string): Promise<void> {
    // When answer is revealed, should show the revelation message
    await expect(this.page.getByText(questionId)).toBeVisible()
    await expect(this.page.getByText('Answer has been revealed!')).toBeVisible()
    await expect(this.page.getByText('Wait for next question...')).toBeVisible()
  }

  async expectQuestionInterface(questionId: string): Promise<void> {
    // Complete question interface should be visible
    await this.expectQuestionActive(questionId)
    await this.expectAnswerChoices()
  }
}