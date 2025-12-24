import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ConfirmationPage extends AbstractPage {
  private readonly header: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'The video link has been booked' })
  }

  static async verifyOnPage(page: Page): Promise<ConfirmationPage> {
    const confirmationPage = new ConfirmationPage(page)
    await expect(confirmationPage.header).toBeVisible()
    await confirmationPage.verifyNoAccessViolationsOnPage()
    return confirmationPage
  }
}
