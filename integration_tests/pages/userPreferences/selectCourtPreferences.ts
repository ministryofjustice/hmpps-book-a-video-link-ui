import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectCourtPreferencesPage extends AbstractPage {
  readonly header: Locator

  readonly showAllSectionsButton: Locator

  readonly confirmButton

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Manage your list of courts' })
    this.showAllSectionsButton = page.getByRole('button', { name: 'Show all sections' })
    this.confirmButton = page.getByRole('button', { name: 'Confirm' })
  }

  static async verifyOnPage(page: Page): Promise<SelectCourtPreferencesPage> {
    const preferencesPage = new SelectCourtPreferencesPage(page)
    await expect(preferencesPage.header).toBeVisible()
    await preferencesPage.verifyNoAccessViolationsOnPage()
    return preferencesPage
  }
}
