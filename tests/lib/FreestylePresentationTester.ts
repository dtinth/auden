import { Page, expect } from '@playwright/test'

export class FreestylePresentationTester {
  constructor(private page: Page) {}

  async navigateToDisplay(): Promise<void> {
    await this.page.goto(this.page.url().replace('#/', '#/display'))
  }

  // Custom HTML/CSS content expectations
  async expectCustomContent(expectedText: string): Promise<void> {
    await expect(this.page.locator('#freestyle').getByText(expectedText)).toBeVisible()
  }

  async expectCustomHTML(htmlContent: string): Promise<void> {
    await expect(this.page.locator('#freestyle')).toContainText(htmlContent)
  }

  async expectNoCustomContent(): Promise<void> {
    const freestyleDiv = this.page.locator('#freestyle')
    await expect(freestyleDiv).toBeEmpty()
  }

  // Chat display functionality
  async expectChatVisible(): Promise<void> {
    await expect(this.page.locator('.ChatView')).toBeVisible()
  }

  async expectChatHidden(): Promise<void> {
    await expect(this.page.locator('.ChatView')).not.toBeVisible()
  }

  async expectChatMessage(userName: string, message: string): Promise<void> {
    const chatView = this.page.locator('.ChatView')
    await expect(chatView.getByText(`${userName}: ${message}`)).toBeVisible()
  }

  async expectChatMessages(messages: Array<{ userName: string; message: string }>): Promise<void> {
    for (const msg of messages) {
      await this.expectChatMessage(msg.userName, msg.message)
    }
  }

  async expectChatMessageCount(count: number): Promise<void> {
    const chatItems = this.page.locator('.ChatView__item')
    await expect(chatItems).toHaveCount(count)
  }

  // Chat auto-scroll behavior
  async expectChatAutoScrolled(): Promise<void> {
    const chatScroller = this.page.locator('.ChatScroller')
    const scrollTop = await chatScroller.evaluate(el => el.scrollTop)
    const scrollHeight = await chatScroller.evaluate(el => el.scrollHeight)
    const offsetHeight = await chatScroller.evaluate(el => el.offsetHeight)
    
    // Should be scrolled to the bottom (allowing for small margin of error)
    expect(scrollTop + offsetHeight).toBeGreaterThanOrEqual(scrollHeight - 10)
  }

  // General display expectations
  async expectFreestyleDisplayActive(): Promise<void> {
    // The freestyle display should be active - look for the freestyle container
    await expect(this.page.locator('#freestyle')).toBeVisible()
  }

  async expectDisplayReady(): Promise<void> {
    // Wait for the presentation view to be fully loaded
    // We can detect this by the presence of the freestyle container
    await expect(this.page.locator('#freestyle')).toBeAttached()
  }

  // Real-time update verification helpers
  async waitForChatMessage(userName: string, message: string, timeout = 5000): Promise<void> {
    const chatView = this.page.locator('.ChatView')
    await expect(chatView.getByText(`${userName}: ${message}`)).toBeVisible({ timeout })
  }

  async waitForCustomContentUpdate(expectedText: string, timeout = 5000): Promise<void> {
    await expect(this.page.locator('#freestyle').getByText(expectedText)).toBeVisible({ timeout })
  }
}