import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ConfirmCancelPage extends AbstractPage {
  private readonly header: Locator

  readonly yesCancelTheBookingButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Are you sure you want to cancel Bob Smith's booking?` })
    this.yesCancelTheBookingButton = page.getByRole('button', { name: 'Yes, cancel the booking' })
  }

  static async verifyOnPage(page: Page): Promise<ConfirmCancelPage> {
    const confirmCancelPage = new ConfirmCancelPage(page)
    await expect(confirmCancelPage.header).toBeVisible()
    await confirmCancelPage.verifyNoAccessViolationsOnPage()
    return confirmCancelPage
  }
}
