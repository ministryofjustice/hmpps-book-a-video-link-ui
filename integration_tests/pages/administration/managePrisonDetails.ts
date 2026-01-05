import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ManagePrisonDetailsPage extends AbstractPage {
  private readonly header: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Manage prison details' })
  }

  static async verifyOnPage(page: Page): Promise<ManagePrisonDetailsPage> {
    const managePrisonDetailsPage = new ManagePrisonDetailsPage(page)
    await expect(managePrisonDetailsPage.header).toBeVisible()
    await managePrisonDetailsPage.verifyNoAccessViolationsOnPage()
    return managePrisonDetailsPage
  }

  managePrisonLink = (prisonCode: string) => this.page.getByTestId(`manage-prison-link-${prisonCode}`)
}
