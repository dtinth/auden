import { Page, expect } from '@playwright/test'
import { VoteAdminTester } from './VoteAdminTester'
import { GrommetCheckbox } from './GrommetCheckbox'

export class AdminTester {
  constructor(
    public readonly page: Page,
    public readonly uid: string,
    public readonly name: string
  ) {}

  get vote(): VoteAdminTester {
    return new VoteAdminTester(this.page)
  }

  async navigateToAdmin(): Promise<void> {
    await this.page.goto(`http://${this.uid}.localhost:3000/#/admin`)
  }

  async createVoteScene(): Promise<string> {
    // Navigate to admin panel first
    await this.navigateToAdmin()

    // Click the Add button to create a new scene
    await this.page.getByRole('button', { name: 'Open Menu' }).click()

    // Select 'vote' from the menu options
    await this.page.getByRole('button', { name: 'vote' }).click()

    // Once the screen is created, we need to click on it to see it
    await this.page.getByRole('link', { name: 'vote' }).click()

    // Wait for the scene to be created and navigate to it
    // This should automatically redirect to the new scene's admin page
    await this.page.waitForURL(/\/admin\/screens\//)

    // Extract the screen ID from the URL
    const url = this.page.url()
    const match = url.match(/\/admin\/screens\/([^/?#]+)/)
    if (!match) {
      throw new Error('Failed to create vote scene - no screen ID found in URL')
    }

    return match[1]
  }

  async activateScene(screenId: string): Promise<void> {
    // Navigate to the specific screen's admin page
    await this.page.goto(
      `http://${this.uid}.localhost:3000/#/admin/screens/${screenId}`
    )

    // Toggle the "active" checkbox to make this scene the current one
    const activeCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: 'active' })
    )
    await activeCheckbox.check()
  }

  async expectAdminInterface(): Promise<void> {
    // Verify we're on the admin panel by checking for admin-specific elements
    await expect(this.page.getByText('Global')).toBeVisible()
    await expect(this.page.getByText('Screens')).toBeVisible()
  }
}
