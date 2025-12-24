import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class LocationAvailabilityPage extends AbstractPage {
  private readonly header: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Available bookings` })
    this.continueButton = page.getByRole('button', { name: 'Continue' }).first()
  }

  static async verifyOnPage(page: Page): Promise<LocationAvailabilityPage> {
    const locationAvailabilityPage = new LocationAvailabilityPage(page)
    await expect(locationAvailabilityPage.header).toBeVisible()
    await locationAvailabilityPage.verifyNoAccessViolationsOnPage()
    return locationAvailabilityPage
  }

  selectSlot = async (slot: string) => this.page.getByRole('radio', { name: `${slot}`, exact: false }).click()
}
