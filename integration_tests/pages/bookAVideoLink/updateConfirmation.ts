import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class UpdateConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly exitToAllBookingsLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'The video link booking has been updated' })
    this.exitToAllBookingsLink = page.getByTestId('exit-to-all-bookings-link')
  }

  static async verifyOnPage(page: Page): Promise<UpdateConfirmationPage> {
    const updateConfirmationPage = new UpdateConfirmationPage(page)
    await expect(updateConfirmationPage.header).toBeVisible()
    await updateConfirmationPage.verifyNoAccessViolationsOnPage()
    return updateConfirmationPage
  }
}
