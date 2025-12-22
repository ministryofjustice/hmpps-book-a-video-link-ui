import AbstractPage from '../abstractPage'
import { expect, Locator, Page } from '@playwright/test'

export default class ConfirmCancelPage extends AbstractPage {
  readonly header: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Are you sure you want to cancel Bob Smith's booking?` })
  }

  static async verifyOnPage(page: Page): Promise<ConfirmCancelPage> {
    const confirmCancelPage = new ConfirmCancelPage(page)
    await expect(confirmCancelPage.header).toBeVisible()
    await confirmCancelPage.verifyNoAccessViolationsOnPage()
    return confirmCancelPage
  }
}
