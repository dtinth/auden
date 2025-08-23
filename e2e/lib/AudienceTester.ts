import { Page, expect } from '@playwright/test'

export class AudienceTester {
  constructor(
    public readonly page: Page, 
    public readonly uid: string, 
    public readonly name: string
  ) {}

  async navigateToAudience(): Promise<void> {
    await this.page.goto(`http://${this.uid}.localhost:3000/#/`)
  }

  async expectWelcomeMessage(): Promise<void> {
    await expect(this.page.getByText('welcome', { exact: false })).toBeVisible()
  }
}
