import { Browser, BrowserContext, Page } from '@playwright/test'
import { AudienceTester } from './AudienceTester'

export class AppTester {
  constructor(private browser: Browser) {}

  async createAudience(userId: string): Promise<AudienceTester> {
    const context = await this.browser.newContext()
    const page = await context.newPage()
    
    // Set up emulator mode via localStorage flags
    await page.addInitScript(() => {
      localStorage.setItem('USE_FIREBASE_EMULATOR', 'true')
      localStorage.setItem('FIREBASE_DB_NAMESPACE', `test-${Date.now()}`)
    })
    
    return new AudienceTester(page, userId)
  }
}