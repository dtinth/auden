import { Page, expect } from '@playwright/test'

export class AudienceTester {
  constructor(private page: Page, private userId: string) {}

  async navigateToAudience(): Promise<void> {
    await this.page.goto('/#/')
  }

  async authenticateAs(displayName: string): Promise<void> {
    // Wait for Firebase to initialize
    await this.page.waitForFunction(() => (window as any).firebase)

    // Create and sign in with custom token via Firebase Auth Emulator
    await this.page.evaluate(async (name) => {
      const firebase = (window as any).firebase
      
      // Create a simple custom token (emulator is more permissive with minimal tokens)
      const customToken = JSON.stringify({
        uid: 'test-user-123',
        name: name
      })
      
      const userCredential = await firebase.auth().signInWithCustomToken(customToken)
      
      // Update the user's displayName since custom tokens don't set this automatically
      await userCredential.user.updateProfile({
        displayName: name
      })
    }, displayName)
  }

  async expectWelcomeMessage(): Promise<void> {
    await expect(this.page.locator('text=welcome')).toBeVisible()
  }
}