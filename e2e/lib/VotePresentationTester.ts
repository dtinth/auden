import { Page, expect } from '@playwright/test'

export class VotePresentationTester {
  constructor(private readonly page: Page) {}

  async expectVotingPrompt(): Promise<void> {
    // When showResults is false, should show the voting prompt
    await expect(this.page.getByText('Please vote')).toBeVisible()
  }

  async expectVoteCount(options: { votes: number; people: number }): Promise<void> {
    // Expect the vote count display when results are hidden
    const { votes, people } = options
    const voteText = votes === 1 ? 'vote' : 'votes'
    const peopleText = people === 1 ? 'person' : 'people'
    const expectedText = `${votes} ${voteText} from ${people} ${peopleText}`
    
    await expect(this.page.getByText(expectedText)).toBeVisible()
  }

  async expectResultsVisible(): Promise<void> {
    // When showResults is true, should show "Voting Results" header
    await expect(this.page.getByText('Voting Results')).toBeVisible()
  }

  async expectResults(expectedResults: Record<string, number>): Promise<void> {
    // Verify the results display shows correct vote counts for each option
    await this.expectResultsVisible()
    
    for (const [optionText, voteCount] of Object.entries(expectedResults)) {
      // Each result is displayed as option text and vote count in separate boxes
      await expect(this.page.getByText(optionText)).toBeVisible()
      await expect(this.page.getByText(voteCount.toString()).first()).toBeVisible()
    }
  }

  async expectResultsHidden(): Promise<void> {
    // When showResults is false, should not show the results header
    await expect(this.page.getByText('Voting Results')).not.toBeVisible()
  }

  async navigateToPresentation(): Promise<void> {
    // Navigate to the presentation view
    await this.page.goto(this.page.url().replace(/#.*/, '') + '#/display')
  }
}