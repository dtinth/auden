import { Page, expect } from '@playwright/test'

export class VoteAdminTester {
  constructor(private page: Page) {}

  async setQuestionText(questionText: string): Promise<void> {
    // Navigate to the question text input and set it
    await this.page
      .getByRole('region', { name: 'Question' })
      .getByRole('textbox')
      .fill(questionText)

    // Click "Set question text" button
    await this.page.getByRole('button', { name: 'Set question text' }).click()
  }

  async setVoteOptions(options: string[]): Promise<void> {
    // Join options with '/' as expected by the interface
    const optionsText = options.join('/')

    // Find the vote options input field and fill it
    const optionsInput = this.page
      .getByRole('region', { name: 'Available options' })
      .getByRole('textbox')
      .first() // The options input is typically the first input in the options panel
    await optionsInput.fill(optionsText)

    // Click "Set vote options" button
    await this.page.getByRole('button', { name: 'Set vote options' }).click()

    // Verify options were set by checking they appear in the interface
    for (const option of options) {
      await expect(this.page.getByText(option).first()).toBeVisible()
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
    this.page.on('dialog', (dialog) => dialog.accept(maxVotes.toString()))
  }

  async expectResults(expectedResults: {
    [option: string]: number
  }): Promise<void> {
    // Check the vote results table for expected vote counts
    for (const [option, expectedCount] of Object.entries(expectedResults)) {
      // Find the table row that contains both the option name and vote count
      // Based on ARIA snapshot: row "JavaScript 1" contains rowheader "JavaScript" and rowheader "1"
      const expectedRowName = `${option} ${expectedCount}`
      await expect(this.page.getByRole('row', { name: expectedRowName })).toBeVisible()
    }
  }

  async expectVoteScene(): Promise<void> {
    // Verify we're in a vote scene by checking for vote-specific elements
    await expect(
      this.page.getByRole('button', { name: 'Set question text' })
    ).toBeVisible()
  }
}
