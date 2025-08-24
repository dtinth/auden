import { Page, expect } from '@playwright/test'

export class FreestyleAudienceTester {
  constructor(private page: Page) {}

  // Custom HTML/CSS content expectations
  async expectCustomContent(expectedText: string): Promise<void> {
    await expect(this.page.locator('#freestyle').getByText(expectedText)).toBeVisible()
  }

  async expectCustomHTML(htmlContent: string): Promise<void> {
    await expect(this.page.locator('#freestyle')).toContainText(htmlContent)
  }

  // Chat functionality
  async expectChatInterface(): Promise<void> {
    await expect(this.page.getByPlaceholder('Send your message (max 280 chars)')).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Send' })).toBeVisible()
  }

  async sendChatMessage(message: string): Promise<void> {
    const chatInput = this.page.getByPlaceholder('Send your message (max 280 chars)')
    await chatInput.fill(message)
    await this.page.getByRole('button', { name: 'Send' }).click()
    // Wait for input to be cleared (indicates message was sent)
    await expect(chatInput).toHaveValue('')
  }

  async expectChatMessage(userName: string, message: string): Promise<void> {
    // Look for the chat message with user name and content
    const chatView = this.page.locator('.ChatView')
    await expect(chatView.getByText(`${userName}: ${message}`)).toBeVisible()
  }

  async expectChatMessages(messages: Array<{ userName: string; message: string }>): Promise<void> {
    for (const msg of messages) {
      await this.expectChatMessage(msg.userName, msg.message)
    }
  }

  // Questions functionality
  async expectQuestionsInterface(): Promise<void> {
    await expect(this.page.getByPlaceholder('Ask a question (max 500 chars)')).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'Send' })).toBeVisible()
    await expect(this.page.getByRole('tab', { name: 'Top Questions' })).toBeVisible()
    await expect(this.page.getByRole('tab', { name: 'Latest' })).toBeVisible()
  }

  async submitQuestion(question: string): Promise<void> {
    const questionInput = this.page.getByPlaceholder('Ask a question (max 500 chars)')
    await questionInput.fill(question)
    await this.page.getByRole('button', { name: 'Send' }).click()
    // Wait for input to be cleared (indicates question was submitted)
    await expect(questionInput).toHaveValue('')
  }

  async expectQuestion(userName: string, questionText: string): Promise<void> {
    const questionView = this.page.locator('.QuestionView')
    const questionItem = questionView.getByTestId('question').filter({
      hasText: questionText
    })
    await expect(questionItem.getByText(userName)).toBeVisible()
    await expect(questionItem.getByText(questionText)).toBeVisible()
  }

  async likeQuestion(questionText: string): Promise<void> {
    const questionItem = this.page.getByTestId('question').filter({
      hasText: questionText
    })
    await questionItem.getByRole('button', { name: 'Like' }).click()
  }

  async expectQuestionLikes(questionText: string, likeCount: number): Promise<void> {
    const questionItem = this.page.getByTestId('question').filter({
      hasText: questionText
    })
    await expect(questionItem.getByText(likeCount.toString())).toBeVisible()
  }

  async switchToTopQuestions(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Top Questions' }).click()
  }

  async switchToLatestQuestions(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Latest' }).click()
  }

  // Display mode switching
  async expectBothInterface(): Promise<void> {
    // When mode is "both", user should see buttons to switch between chat and questions
    await expect(this.page.getByRole('button', { name: 'chat' })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'questions' })).toBeVisible()
  }

  async switchToChatInBothMode(): Promise<void> {
    await this.page.getByRole('button', { name: 'chat' }).click()
    await this.expectChatInterface()
  }

  async switchToQuestionsInBothMode(): Promise<void> {
    await this.page.getByRole('button', { name: 'questions' }).click()
    await this.expectQuestionsInterface()
  }

  // Display mode expectations
  async expectArbitraryMode(): Promise<void> {
    // In arbitrary mode, should see the freestyle div for custom content
    await expect(this.page.locator('#freestyle')).toBeVisible()
  }

  async expectChatMode(): Promise<void> {
    await this.expectChatInterface()
  }

  async expectQuestionsMode(): Promise<void> {
    await this.expectQuestionsInterface()
  }

  async expectBothMode(): Promise<void> {
    await this.expectBothInterface()
  }
}