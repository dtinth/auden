import { Page, expect } from '@playwright/test'

export class AudienceTester {
  constructor(private page: Page, private userId: string) {}

  async setupEmulatorAndAuthenticate(displayName: string): Promise<void> {
    // Navigate to app (shows login page)
    await this.page.goto('/')

    // Click "Show Testing Config" button
    await this.page.getByRole('button', { name: 'Show Testing Config' }).click()

    // Enable emulator mode
    // Have to use `getByText` instead of `getByRole(checkbox)` here
    // because Grommet renders a hidden checkbox input which does not
    // work that well with Playwright.
    await this.page.getByText('Enable Firebase Emulator Mode').click()

    // Set database namespace
    const namespace = `test-${Date.now()}-${this.userId}`
    await this.page.getByPlaceholder(/test-/).fill(namespace)

    // Apply settings (this will reload the page)
    await this.page.getByRole('button', { name: 'Apply & Reload' }).click()

    // Wait for page to reload and show emulator mode UI
    await this.page.getByText('🧪 Emulator Mode Active').waitFor()

    // Create and paste custom token
    const customToken = JSON.stringify({
      uid: this.userId,
      name: displayName,
    })

    await this.page
      .getByPlaceholder('Paste custom JWT token here...')
      .fill(customToken)

    // Sign in with custom token
    await this.page
      .getByRole('button', { name: 'Sign in with Custom Token' })
      .click()

    // Wait for authentication to complete
    await this.page.waitForFunction(
      () => (window as any).firebase?.auth()?.currentUser
    )

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
    await expect(this.page.getByText('welcome', { exact: false })).toBeVisible()
  }
}
