import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class AlternativeRoomsPage extends AbstractPage {
  private readonly header: Locator

  readonly checkForOtherAvailabilityButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'No bookings available for your selected time' })
    this.checkForOtherAvailabilityButton = page.getByRole('button', { name: 'Check for other availability >' })
  }

  static async verifyOnPage(page: Page): Promise<AlternativeRoomsPage> {
    const noSlotsAvailablePage = new AlternativeRoomsPage(page)
    await expect(noSlotsAvailablePage.header).toBeVisible()
    await noSlotsAvailablePage.verifyNoAccessViolationsOnPage()
    return noSlotsAvailablePage
  }

  assertDate = (date: string) => this.assertSummaryListValue('booking-details', 'Date', date)

  assertPreHearingTime = (hearingTime: string) =>
    this.assertSummaryListValue('booking-details', 'Pre-court hearing briefing time', hearingTime)

  assertHearingTime = (hearingTime: string) =>
    this.assertSummaryListValue('booking-details', 'Hearing time', hearingTime)

  assertPostHearingTime = (hearingTime: string) =>
    this.assertSummaryListValue('booking-details', 'Post-court hearing briefing time', hearingTime)
}
