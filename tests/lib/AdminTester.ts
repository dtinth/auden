import { Page, expect } from '@playwright/test'
import { FreestyleAdminTester } from './FreestyleAdminTester'
import { GrommetCheckbox } from './GrommetCheckbox'
import { QuizAdminTester } from './QuizAdminTester'
import { VoteAdminTester } from './VoteAdminTester'

export class AdminTester {
  constructor(
    public readonly page: Page,
    public readonly uid: string,
    public readonly name: string
  ) {}

  get quiz(): QuizAdminTester {
    return new QuizAdminTester(this.page)
  }

  get vote(): VoteAdminTester {
    return new VoteAdminTester(this.page)
  }

  get freestyle(): FreestyleAdminTester {
    return new FreestyleAdminTester(this.page)
  }

  async navigateToAdmin(): Promise<void> {
    await this.page.goto(`http://${this.uid}.localhost:3000/#/admin`)
  }

  async createVoteScene(): Promise<string> {
    return this.createScene('vote')
  }

  async createQuizScene(): Promise<string> {
    return this.createScene('quiz')
  }

  async createFreestyleScene(): Promise<string> {
    return this.createScene('freestyle')
  }

  private async createScene(sceneName: 'vote' | 'quiz' | 'freestyle'): Promise<string> {
    // Navigate to admin panel first
    await this.navigateToAdmin()

    // Click the Add button to create a new scene
    await this.page.getByRole('button', { name: 'Open Menu' }).click()

    // Select the scene type from the menu options
    await this.page.getByRole('menuitem', { name: sceneName }).click()

    // Once the screen is created, we need to click on it to see it
    await this.page.getByRole('link', { name: sceneName }).click()

    // Wait for the scene to be created and navigate to it
    // This should automatically redirect to the new scene's admin page
    await this.page.waitForURL(/\/admin\/screens\//)

    // Extract the screen ID from the URL
    const url = this.page.url()
    const match = url.match(/\/admin\/screens\/([^/?#]+)/)
    if (!match) {
      throw new Error(
        `Failed to create ${sceneName} scene - no screen ID found in URL`
      )
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
