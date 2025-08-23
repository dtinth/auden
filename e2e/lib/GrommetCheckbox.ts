import { Page, Locator, expect } from '@playwright/test'

/**
 * Helper class for interacting with Grommet checkbox components.
 * Grommet hides the actual checkbox input, making it not actionable via standard Playwright clicks.
 * This helper uses JavaScript evaluation to interact with the underlying input element.
 */
export class GrommetCheckbox {
  constructor(private readonly locator: Locator) {}

  /**
   * Toggle the checkbox state (check if unchecked, uncheck if checked)
   */
  async toggle(): Promise<void> {
    await this.locator.evaluate((el: HTMLInputElement) => el.click())
  }

  /**
   * Check the checkbox (only if not already checked)
   */
  async check(): Promise<void> {
    const isChecked = await this.isChecked()
    if (!isChecked) {
      await this.toggle()
    }
  }

  /**
   * Uncheck the checkbox (only if currently checked)
   */
  async uncheck(): Promise<void> {
    const isChecked = await this.isChecked()
    if (isChecked) {
      await this.toggle()
    }
  }

  /**
   * Get the current checked state of the checkbox
   */
  async isChecked(): Promise<boolean> {
    return await this.locator.isChecked()
  }

  /**
   * Assert that the checkbox is checked
   */
  async expectChecked(): Promise<void> {
    await expect(this.locator).toBeChecked()
  }

  /**
   * Assert that the checkbox is not checked
   */
  async expectUnchecked(): Promise<void> {
    await expect(this.locator).not.toBeChecked()
  }

  /**
   * Assert that the checkbox is visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.locator).toBeVisible()
  }
}