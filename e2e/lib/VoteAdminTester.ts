import { Page, expect } from '@playwright/test'

export class VoteAdminTester {
  constructor(private page: Page) {}

  async setQuestionText(questionText: string): Promise<void> {
    // Navigate to the question text input and set it
    await this.page.getByPlaceholder(/Choose your favorite!/).fill(questionText)
    
    // Click "Set question text" button
    await this.page.getByRole('button', { name: 'Set question text' }).click()
    
    // Wait for success message or verify the text was set
    await expect(this.page.getByText(questionText)).toBeVisible()
  }

  async setVoteOptions(options: string[]): Promise<void> {
    // Join options with '/' as expected by the interface
    const optionsText = options.join('/')
    
    // Find the vote options input field and fill it
    const optionsInput = this.page.locator('input').first() // The options input is typically the first input in the options panel
    await optionsInput.fill(optionsText)
    
    // Click "Set vote options" button
    await this.page.getByRole('button', { name: 'Set vote options' }).click()
    
    // Verify options were set by checking they appear in the interface
    for (const option of options) {
      await expect(this.page.getByText(option)).toBeVisible()
    }
  }

  async enableVoting(): Promise<void> {
    // Toggle the "Enabled" checkbox to enable voting
    // Use getByText because Grommet checkboxes don't work well with getByRole
    await this.page.getByText('Enabled').click()
    
    // Verify voting is enabled (checkbox should be checked)
    await expect(this.page.getByText('Enabled')).toBeVisible()
  }

  async setMaxVotes(maxVotes: number): Promise<void> {
    // Click the "Max votes" button to open the prompt
    await this.page.getByRole('button', { name: /Max votes:/ }).click()
    
    // Handle the browser prompt dialog
    this.page.on('dialog', dialog => dialog.accept(maxVotes.toString()))
  }

  async expectResults(expectedResults: { [option: string]: number }): Promise<void> {
    // Check the vote results table for expected vote counts
    for (const [option, expectedCount] of Object.entries(expectedResults)) {
      // Look for the option text and its corresponding vote count
      await expect(this.page.getByText(option)).toBeVisible()
      await expect(this.page.getByText(expectedCount.toString())).toBeVisible()
    }
  }

  async expectVoteScene(): Promise<void> {
    // Verify we're in a vote scene by checking for vote-specific elements
    await expect(this.page.getByText('Question')).toBeVisible()
    await expect(this.page.getByText('Available options')).toBeVisible()
    await expect(this.page.getByText('Vote results')).toBeVisible()
  }

  async setAdminStatusInDatabase(adminId: string): Promise<void> {
    // Use the browser console to directly set the admin status in the Firebase database
    // This simulates what would happen if an admin manually sets another user as admin
    await this.page.evaluate((uid) => {
      // Access the global firebase instance that should be available in the app
      (window as any).firebase.database().ref(`/admins/${uid}`).set(true)
    }, adminId)
  }
}