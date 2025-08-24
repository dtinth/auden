import { Page, expect } from '@playwright/test'
import { FreestyleAudienceTester } from './FreestyleAudienceTester'
import { QuizAudienceTester } from './QuizAudienceTester'
import { VoteAudienceTester } from './VoteAudienceTester'

export class AudienceTester {
  constructor(
    public readonly page: Page, 
    public readonly uid: string, 
    public readonly name: string
  ) {}

  get quiz(): QuizAudienceTester {
    return new QuizAudienceTester(this.page)
  }

  get vote(): VoteAudienceTester {
    return new VoteAudienceTester(this.page)
  }

  get freestyle(): FreestyleAudienceTester {
    return new FreestyleAudienceTester(this.page)
  }

  async navigateToAudience(): Promise<void> {
    await this.page.goto(`http://${this.uid}.localhost:3000/#/`)
  }

  async expectWelcomeMessage(): Promise<void> {
    await expect(this.page.getByText('welcome', { exact: false })).toBeVisible()
  }
}
