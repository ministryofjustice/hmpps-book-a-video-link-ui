import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CheckRequestPage extends AbstractPage {
  private readonly header: Locator

  readonly requestVideoLinkButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Check and confirm your request` })
    this.requestVideoLinkButton = page.getByRole('button', { name: 'Request video link' })
  }

  static async verifyOnPage(page: Page): Promise<CheckRequestPage> {
    const checkRequestPage = new CheckRequestPage(page)
    await expect(checkRequestPage.header).toBeVisible()
    await checkRequestPage.verifyNoAccessViolationsOnPage()
    return checkRequestPage
  }
}
