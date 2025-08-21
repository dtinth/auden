import { Page, expect } from '@playwright/test'

export class AudienceTester {
  constructor(private page: Page, private userId: string) {}

  async setupEmulatorAndAuthenticate(displayName: string): Promise<void> {
    // Navigate to app (shows login page)
    await this.page.goto('/')
    
    // Click "Show Testing Config" button
    await this.page.click('text=Show Testing Config')
    
    // Enable emulator mode
    await this.page.check('text=Enable Firebase Emulator Mode')
    
    // Set database namespace
    const namespace = `test-${Date.now()}-${this.userId}`
    await this.page.fill('input[placeholder*="test-"]', namespace)
    
    // Apply settings (this will reload the page)
    await this.page.click('text=Apply & Reload')
    
    // Wait for page to reload and show emulator mode UI
    await this.page.waitForSelector('text=🧪 Emulator Mode Active')
    
    // Create and paste custom token
    const customToken = JSON.stringify({
      uid: this.userId,
      name: displayName
    })
    
    await this.page.fill('textarea[placeholder*="custom JWT token"]', customToken)
    
    // Sign in with custom token
    await this.page.click('text=Sign in with Custom Token')
    
    // Wait for authentication to complete
    await this.page.waitForFunction(() => (window as any).firebase?.auth()?.currentUser)
    
    // Update display name
    await this.page.evaluate(async (name) => {
      const user = (window as any).firebase.auth().currentUser
      if (user) {
        await user.updateProfile({ displayName: name })
      }
    }, displayName)
  }

  async navigateToAudience(): Promise<void> {
    await this.page.goto('/#/')
  }

  async expectWelcomeMessage(): Promise<void> {
    await expect(this.page.locator('text=welcome')).toBeVisible()
  }
}