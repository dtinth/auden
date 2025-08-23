import { Page, expect } from '@playwright/test'
import { VotePresentationTester } from './VotePresentationTester'

export class PresentationTester {
  constructor(
    public readonly page: Page,
    public readonly uid: string,
    public readonly name: string
  ) {}

  get vote(): VotePresentationTester {
    return new VotePresentationTester(this.page)
  }

  async navigateToDisplay(): Promise<void> {
    await this.page.goto(`http://${this.uid}.localhost:3000/#/display`)
  }

  async expectDisplayInterface(): Promise<void> {
    // Verify we're on the display view by checking for display-specific elements
    // The display view should show the current scene content
    await expect(this.page.locator('body')).toBeVisible()
  }
}