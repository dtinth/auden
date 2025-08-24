import { Page, expect } from '@playwright/test'
import { FreestylePresentationTester } from './FreestylePresentationTester'
import { QuizPresentationTester } from './QuizPresentationTester'
import { VotePresentationTester } from './VotePresentationTester'

export class PresentationTester {
  constructor(
    public readonly page: Page,
    public readonly uid: string,
    public readonly name: string
  ) {}

  get quiz(): QuizPresentationTester {
    return new QuizPresentationTester(this.page)
  }

  get vote(): VotePresentationTester {
    return new VotePresentationTester(this.page)
  }

  get freestyle(): FreestylePresentationTester {
    return new FreestylePresentationTester(this.page)
  }

  async navigateToDisplay(): Promise<void> {
    await this.page.goto(`http://${this.uid}.localhost:3000/#/display`)
  }

  async expectDisplayInterface(): Promise<void> {
    // Verify we're on the display view by checking for the display root element
    await expect(this.page.getByTestId('display-root')).toBeVisible()
  }
}