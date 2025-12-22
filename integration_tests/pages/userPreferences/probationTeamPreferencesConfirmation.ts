import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ProbationTeamPreferencesConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly continueButton

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Your probation team list has been updated' })
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<ProbationTeamPreferencesConfirmationPage> {
    const probationTeamPreferencesConfirmationPage = new ProbationTeamPreferencesConfirmationPage(page)
    await expect(probationTeamPreferencesConfirmationPage.header).toBeVisible()
    await probationTeamPreferencesConfirmationPage.verifyNoAccessViolationsOnPage()
    return probationTeamPreferencesConfirmationPage
  }
}
