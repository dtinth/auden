import { BrowserContext, Page } from '@playwright/test'
import { AudienceTester } from './AudienceTester'

export class AppTester {
  constructor(private context: BrowserContext) {}

  async createAudience(userId: string): Promise<AudienceTester> {
    const page = await this.context.newPage()
    
    return new AudienceTester(page, userId)
  }
}