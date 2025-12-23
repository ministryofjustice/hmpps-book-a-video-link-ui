import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class PrisonerNotListedPage extends AbstractPage {
  readonly header: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'You can request a video link booking for a prisoner' })
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<PrisonerNotListedPage> {
    const prisonerNotListedPage = new PrisonerNotListedPage(page)
    await expect(prisonerNotListedPage.header).toBeVisible()
    await prisonerNotListedPage.verifyNoAccessViolationsOnPage()
    return prisonerNotListedPage
  }
}
