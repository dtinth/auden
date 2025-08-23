import { Page, expect } from '@playwright/test'
import { GrommetCheckbox } from './GrommetCheckbox'

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
    const enabledCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: 'Enabled' })
    )
    
    // Check the checkbox (only if not already checked)
    await enabledCheckbox.check()

    // Verify voting is enabled (checkbox should be checked)
    await enabledCheckbox.expectChecked()
  }

  async setMaxVotes(maxVotes: number): Promise<void> {
    // Handle the browser prompt dialog before clicking to avoid race condition
    this.page.once('dialog', (dialog) => dialog.accept(maxVotes.toString()))
    
    // Click the "Max votes" button to open the prompt
    await this.page.getByRole('button', { name: /Max votes:/ }).click()
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

  async showResults(): Promise<void> {
    // Toggle the "Show results" checkbox to display results
    const showResultsCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: 'Show results' })
    )
    
    // Check the checkbox (only if not already checked)
    await showResultsCheckbox.check()

    // Verify results display is enabled (checkbox should be checked)
    await showResultsCheckbox.expectChecked()
  }

  async expectVoteScene(): Promise<void> {
    // Verify we're in a vote scene by checking for vote-specific elements
    await expect(
      this.page.getByRole('button', { name: 'Set question text' })
    ).toBeVisible()
  }
}
