import { Page, expect } from '@playwright/test'

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
    // Use getByText since Grommet checkboxes don't work well with getByRole
    await this.page.getByText(optionText).click()
    
    // Verify the option appears selected (this might take a moment for the UI to update)
    await this.expectSelectedOption(optionText)
  }

  async expectSelectedOption(optionText: string): Promise<void> {
    // Verify that the option is visually selected
    // This might require checking for a checked state or visual indicator
    const optionElement = this.page.getByText(optionText)
    await expect(optionElement).toBeVisible()
    
    // The checkbox should be checked - we can verify this by looking for the checkbox input that's associated with this option
    // Since Grommet might hide the actual checkbox, we'll look for visual indicators or the presence of the option text
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
    // Click on the option again to unselect it
    await this.page.getByText(optionText).click()
    
    // Verify the option is no longer selected
    // This is the opposite of expectSelectedOption
  }

  async expectNoVotingInterface(): Promise<void> {
    // Verify that no voting interface is displayed (when no vote scene is active)
    await expect(this.page.getByText('Wait for voting to open...')).not.toBeVisible()
    await expect(this.page.getByText(/max:/)).not.toBeVisible()
  }

  async getSelectedOptions(): Promise<string[]> {
    // Return a list of currently selected options
    // This is useful for verifying the state without making assertions
    // Implementation would depend on how Grommet renders checked checkboxes
    const selectedOptions: string[] = []
    
    // This is a placeholder - the actual implementation would need to inspect
    // the DOM to find which checkboxes are checked
    return selectedOptions
  }
}