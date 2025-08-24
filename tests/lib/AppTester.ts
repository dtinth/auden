import { BrowserContext, Page, expect } from '@playwright/test'
import { AdminTester } from './AdminTester'
import { AudienceTester } from './AudienceTester'
import { PresentationTester } from './PresentationTester'
import { getOrCreateNamespace } from './namespace'

export class AppTester {
  constructor(private context: BrowserContext) {}

  /**
   * Initialize a user with emulator setup and authentication.
   * All users created in the same test context will share the same database namespace.
   *
   * @param userId - Unique identifier for the user (used for subdomain)
   * @param displayName - Display name for the user
   * @param role - Role of the user ('admin' or 'audience')
   * @returns Configured Page instance ready for testing
   */
  async initAppUser(
    userId: string,
    displayName: string,
    role: 'admin' | 'audience'
  ): Promise<Page> {
    const page = await this.context.newPage()
    const namespace = getOrCreateNamespace(this.context)

    // Navigate to user-specific subdomain
    await page.goto(`http://${userId}.localhost:3000/`)

    // Click "Show Testing Config" button
    await page.getByRole('button', { name: 'Show Testing Config' }).click()

    // Enable emulator mode
    // Have to use `getByText` instead of `getByRole(checkbox)` here
    // because Grommet renders a hidden checkbox input which does not
    // work that well with Playwright.
    await page.getByText('Enable Firebase Emulator Mode').click()

    // Set shared database namespace for this test
    await page.getByPlaceholder(/test-/).fill(namespace)

    // Apply settings (this will reload the page)
    await page.getByRole('button', { name: 'Apply & Reload' }).click()

    // Wait for page to reload and show emulator mode UI
    await page.getByText('🧪 Emulator Mode Active').waitFor()

    // Create and paste custom token
    const customToken = JSON.stringify({
      uid: userId,
      claims: { name: displayName },
    })

    await page
      .getByPlaceholder('Paste custom JWT token here...')
      .fill(customToken)

    // Sign in with custom token
    await page
      .getByRole('button', { name: 'Sign in with Custom Token' })
      .click()

    // Wait for authentication to complete by expecting greeting
    const firstName = displayName.split(' ')[0]
    await expect(page.getByText(`Hi, ${firstName}!`)).toBeVisible()

    // If this is an admin user, set admin status in database
    if (role === 'admin') {
      await this.setAdminStatusInDatabase(page, userId)
      // Wait for admin status to appear in UI
      await expect(page.getByText('(admin)')).toBeVisible()
    }

    return page
  }

  async createAudience(
    profile: 'alice' | 'bob'
  ): Promise<AudienceTester> {
    const profiles: Record<typeof profile, { userId: string; displayName: string }> = {
      alice: { userId: 'audience-alice', displayName: 'Alice' },
      bob: { userId: 'audience-bob', displayName: 'Bob' }
    }
    const { userId, displayName } = profiles[profile]
    const page = await this.initAppUser(userId, displayName, 'audience')
    
    // Set mobile viewport for audience users (iPhone 12 dimensions)
    await page.setViewportSize({ width: 390, height: 844 })
    
    return new AudienceTester(page, userId, displayName)
  }

  async createAdmin(): Promise<AdminTester> {
    const userId = 'admin-user'
    const displayName = 'Admin User'
    const page = await this.initAppUser(userId, displayName, 'admin')
    return new AdminTester(page, userId, displayName)
  }

  async createPresentation(): Promise<PresentationTester> {
    const userId = 'presentation-user'
    const displayName = 'Presentation Display'
    const page = await this.initAppUser(userId, displayName, 'admin')
    return new PresentationTester(page, userId, displayName)
  }

  private async setAdminStatusInDatabase(
    page: Page,
    adminId: string
  ): Promise<void> {
    // Use the browser console to directly set the admin status in the Firebase database
    await page.evaluate((uid) => {
      // Access the global firebase instance that should be available in the app
      return (window as any).firebase.database().ref(`/admins/${uid}`).set(true)
    }, adminId)
  }
}
