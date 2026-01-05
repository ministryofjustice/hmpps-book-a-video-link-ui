import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class AdministrationPage extends AbstractPage {
  private readonly header: Locator

  readonly extractDataByHearingDateLink: Locator

  readonly extractDataByBookingDateLink: Locator

  readonly managePrisonVideoRoomsLink: Locator

  readonly managePrisonDetailsLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Administration' })
    this.extractDataByHearingDateLink = page.getByRole('link', { name: 'Extract data by hearing date' })
    this.extractDataByBookingDateLink = page.getByRole('link', { name: 'Extract data by booking date' })
    this.managePrisonVideoRoomsLink = page.getByRole('link', { name: 'Manage prison video rooms' })
    this.managePrisonDetailsLink = page.getByRole('link', { name: 'Manage prison details' })
  }

  static async verifyOnPage(page: Page): Promise<AdministrationPage> {
    const administrationPage = new AdministrationPage(page)
    await expect(administrationPage.header).toBeVisible()
    await administrationPage.verifyNoAccessViolationsOnPage()
    return administrationPage
  }
}
