import { Page, expect } from '@playwright/test'
import { GrommetCheckbox } from './GrommetCheckbox'

export class FreestyleAdminTester {
  constructor(private page: Page) {}

  async expectFreestyleScene(): Promise<void> {
    await expect(this.page.getByText('Presentation view')).toBeVisible()
    await expect(this.page.getByText('Audience view')).toBeVisible()
  }

  // Presentation view controls
  async enablePresentationChat(): Promise<void> {
    const chatCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: 'Show chat' })
    )
    await chatCheckbox.check()
  }

  async disablePresentationChat(): Promise<void> {
    const chatCheckbox = new GrommetCheckbox(
      this.page.getByRole('checkbox', { name: 'Show chat' })
    )
    await chatCheckbox.uncheck()
  }

  async setPresentationHTML(html: string): Promise<void> {
    // Find the "Arbitrary HTML" section under "Presentation view"
    const presentationSection = this.page.getByRole('region', { name: 'Presentation view' })
    
    // Look for the textbox that comes after "Arbitrary HTML" text
    const htmlTextarea = presentationSection.getByText('Arbitrary HTML').locator('..').getByRole('textbox')
    await htmlTextarea.clear()
    await htmlTextarea.type(html)
    
    // Find the Save button that comes after the HTML textbox
    const saveButton = htmlTextarea.locator('..').getByRole('button', { name: 'Save' })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()
  }

  async setPresentationCSS(css: string): Promise<void> {
    // Find the "Arbitrary CSS" section under "Presentation view"  
    const presentationSection = this.page.getByRole('region', { name: 'Presentation view' })
    
    // Look for the textbox that comes after "Arbitrary CSS" text
    const cssTextarea = presentationSection.getByText('Arbitrary CSS').locator('..').getByRole('textbox')
    await cssTextarea.clear()
    await cssTextarea.type(css)
    
    // Find the Save button that comes after the CSS textbox
    const saveButton = cssTextarea.locator('..').getByRole('button', { name: 'Save' })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()
  }

  // Audience view controls
  async setAudienceDisplayMode(mode: 'arbitrary' | 'chat' | 'questions' | 'both'): Promise<void> {
    const audienceSection = this.page.getByRole('region', { name: 'Audience view' })
    // Since Grommet radio buttons might be hidden, click on the text label instead
    await audienceSection.getByText(mode, { exact: true }).click()
  }

  async setAudienceHTML(html: string): Promise<void> {
    // Find the "Arbitrary HTML" section under "Audience view"
    const audienceSection = this.page.getByRole('region', { name: 'Audience view' })
    
    // Look for the textbox that comes after "Arbitrary HTML" text
    const htmlTextarea = audienceSection.getByText('Arbitrary HTML').locator('..').getByRole('textbox')
    await htmlTextarea.clear()
    await htmlTextarea.type(html)
    
    // Find the Save button that comes after the HTML textbox
    const saveButton = htmlTextarea.locator('..').getByRole('button', { name: 'Save' })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()
  }

  async setAudienceCSS(css: string): Promise<void> {
    // Find the "Arbitrary CSS" section under "Audience view"
    const audienceSection = this.page.getByRole('region', { name: 'Audience view' })
    
    // Look for the textbox that comes after "Arbitrary CSS" text
    const cssTextarea = audienceSection.getByText('Arbitrary CSS').locator('..').getByRole('textbox')
    await cssTextarea.clear()
    await cssTextarea.type(css)
    
    // Find the Save button that comes after the CSS textbox
    const saveButton = cssTextarea.locator('..').getByRole('button', { name: 'Save' })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()
  }

  async expectPresentationChatEnabled(): Promise<void> {
    await expect(this.page.getByRole('checkbox', { name: 'Show chat' })).toBeChecked()
  }

  async expectPresentationChatDisabled(): Promise<void> {
    await expect(this.page.getByRole('checkbox', { name: 'Show chat' })).not.toBeChecked()
  }

  async expectAudienceDisplayMode(mode: 'arbitrary' | 'chat' | 'questions' | 'both'): Promise<void> {
    const audienceSection = this.page.getByRole('region', { name: 'Audience view' })
    // Check if the radiogroup has the correct value selected
    await expect(audienceSection.getByRole('radiogroup')).toContainText(mode)
  }
}