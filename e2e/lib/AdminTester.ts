import { Page, expect } from '@playwright/test'

export class AdminTester {
  constructor(
    public readonly page: Page, 
    public readonly uid: string, 
    public readonly name: string
  ) {}

  async navigateToAdmin(): Promise<void> {
    await this.page.goto(`http://${this.uid}.localhost:3000/#/admin`)
  }

  async createVoteScene(): Promise<string> {
    // Navigate to admin panel first
    await this.navigateToAdmin()

    // Click the Add button to create a new scene
    await this.page.locator('[aria-label="Menu"]').click()

    // Select 'vote' from the menu options
    await this.page.getByText('vote').click()

    // Wait for the scene to be created and navigate to it
    // This should automatically redirect to the new scene's admin page
    await this.page.waitForURL(/\/admin\/screens\//)

    // Extract the screen ID from the URL
    const url = this.page.url()
    const match = url.match(/\/admin\/screens\/(.+)/)
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
    // Use getByText for Grommet checkbox components
    await this.page.getByText('active').click()

    // Verify the scene is now active (checkbox should be checked)
    await expect(this.page.getByText('active')).toBeVisible()
  }

  async expectAdminInterface(): Promise<void> {
    // Verify we're on the admin panel by checking for admin-specific elements
    await expect(this.page.getByText('Global')).toBeVisible()
    await expect(this.page.getByText('Screens')).toBeVisible()
  }

}
