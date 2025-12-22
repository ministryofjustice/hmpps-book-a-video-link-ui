import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CourtPreferencesConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly continueButton

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Your court list has been updated' })
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<CourtPreferencesConfirmationPage> {
    const courtPreferencesConfirmationPage = new CourtPreferencesConfirmationPage(page)
    await expect(courtPreferencesConfirmationPage.header).toBeVisible()
    await courtPreferencesConfirmationPage.verifyNoAccessViolationsOnPage()
    return courtPreferencesConfirmationPage
  }
}
