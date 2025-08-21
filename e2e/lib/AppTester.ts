import { Browser, BrowserContext, Page } from '@playwright/test'
import { AudienceTester } from './AudienceTester'

export class AppTester {
  constructor(private browser: Browser) {}

  async createAudience(userId: string): Promise<AudienceTester> {
    const context = await this.browser.newContext()
    const page = await context.newPage()
    
    return new AudienceTester(page, userId)
  }
}