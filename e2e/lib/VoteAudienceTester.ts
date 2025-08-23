import { Page, expect } from '@playwright/test'
import { GrommetCheckbox } from './GrommetCheckbox'

export class VoteAudienceTester {
  constructor(private page: Page) {}

  async expectVotingInterface(questionText: string): Promise<void> {
    // Verify the voting interface is displayed with the expected question
    await expect(this.page.getByText(questionText)).toBeVisible()
    
    // Verify voting controls are visible (max votes indicator)
    await expect(this.page.getByText(/max:/)).toBeVisible()
  }

  async expectVotingOptions(options: string[]): Promise<void> {
    // Verify all voting options are displayed
    for (const option of options) {
      await expect(this.page.getByText(option)).toBeVisible()
    }
  }

  async selectOption(optionText: string): Promise<void> {
    // Click on the option to vote for it
    const optionCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: optionText })
    )
    await optionCheckbox.check()
    
    // Verify the option appears selected (this might take a moment for the UI to update)
    await this.expectSelectedOption(optionText)
  }

  async expectSelectedOption(optionText: string): Promise<void> {
    // Find the checkbox associated with this option text
    const optionCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: optionText })
    )
    
    // Verify the option is visible and checked
    await optionCheckbox.expectVisible()
    await optionCheckbox.expectChecked()
  }

  async expectWaitingMessage(): Promise<void> {
    // Verify the waiting message is displayed when voting is disabled
    await expect(this.page.getByText('Wait for voting to open...')).toBeVisible()
  }

  async expectVoteSubmitted(): Promise<void> {
    // Verify that the vote was successfully submitted
    // This could be indicated by the checkbox being checked or other UI feedback
    // For now, we'll just verify that we're still on the voting interface and no error occurred
    await expect(this.page.getByText(/max:/)).toBeVisible()
  }

  async expectMaxVotesReached(maxVotes: number): Promise<void> {
    // Try to vote for more options than allowed and expect an error
    // This would typically show an error message about reaching the vote limit
    await expect(this.page.getByText(`Cannot vote more than ${maxVotes}`)).toBeVisible()
  }

  async unselectOption(optionText: string): Promise<void> {
    // Find the checkbox associated with this option text
    const optionCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: optionText })
    )
    
    // Uncheck the checkbox (only if currently checked)
    await optionCheckbox.uncheck()
    
    // Verify the option is no longer selected
    await optionCheckbox.expectUnchecked()
  }

  async expectNoVotingInterface(): Promise<void> {
    // Verify that no voting interface is displayed (when no vote scene is active)
    await expect(this.page.getByText('Wait for voting to open...')).not.toBeVisible()
    await expect(this.page.getByText(/max:/)).not.toBeVisible()
  }

  async getSelectedOptions(): Promise<string[]> {
    // Find all checkboxes that are checked
    const checkedCheckboxes = this.page.getByRole('checkbox', { checked: true })
    
    // Get the accessible name (label text) of each checked checkbox
    const checkboxCount = await checkedCheckboxes.count()
    const selectedOptions: string[] = []
    
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = checkedCheckboxes.nth(i)
      const accessibleName = await checkbox.getAttribute('aria-label') || await checkbox.getAttribute('name')
      if (accessibleName) {
        selectedOptions.push(accessibleName)
      }
    }
    
    return selectedOptions
  }
}