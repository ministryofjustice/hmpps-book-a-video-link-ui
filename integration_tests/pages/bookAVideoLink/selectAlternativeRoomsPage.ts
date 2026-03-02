import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectAlternativeRoomsPage extends AbstractPage {
  private readonly header: Locator

  readonly continueButton: Locator = this.page.getByRole('button', { name: 'Continue' })

  readonly selectASuitableSlotLink: Locator = this.page.getByRole('link', { name: 'Select a suitable slot' })

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'No bookings available for your selected time' })
  }

  static async verifyOnPage(page: Page): Promise<SelectAlternativeRoomsPage> {
    const selectAlternativeRoomsPage = new SelectAlternativeRoomsPage(page)
    await expect(selectAlternativeRoomsPage.header).toBeVisible()
    // // aria-allowed-attr is disabled because radio buttons can have aria-expanded which isn't
    // // currently allowed by the spec, but that might change: https://github.com/w3c/aria/issues/1404
    await selectAlternativeRoomsPage.verifyNoAccessViolationsOnPage(['aria-allowed-attr'])
    return selectAlternativeRoomsPage
  }

  selectSlot = async (slot: string) => this.page.getByRole('radio', { name: `${slot}`, exact: false }).click()
}
