import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ConfirmedCancelPage extends AbstractPage {
  readonly header: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `This video link booking has been cancelled` })
  }

  static async verifyOnPage(page: Page): Promise<ConfirmedCancelPage> {
    const confirmedCancelPage = new ConfirmedCancelPage(page)
    await expect(confirmedCancelPage.header).toBeVisible()
    await confirmedCancelPage.verifyNoAccessViolationsOnPage()
    return confirmedCancelPage
  }
}
