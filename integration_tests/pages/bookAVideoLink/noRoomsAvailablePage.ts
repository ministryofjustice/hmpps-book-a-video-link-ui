import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class NoRoomsAvailablePage extends AbstractPage {
  private readonly header: Locator

  readonly changeTimesButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'No bookings available' })
    this.changeTimesButton = page.getByRole('button', { name: 'Change times' })
  }

  static async verifyOnPage(page: Page): Promise<NoRoomsAvailablePage> {
    const noRoomsAvailablePage = new NoRoomsAvailablePage(page)
    await expect(noRoomsAvailablePage.header).toBeVisible()
    await noRoomsAvailablePage.verifyNoAccessViolationsOnPage()
    return noRoomsAvailablePage
  }

  assertPrison = (prison: string) => this.assertSummaryListValue('booking-details', 'Prison', prison)

  assertCourt = (court: string) => this.assertSummaryListValue('booking-details', 'Court', court)

  assertDate = (date: string) => this.assertSummaryListValue('booking-details', 'Date', date)

  assertPreHearingTime = (hearingTime: string) =>
    this.assertSummaryListValue('booking-details', 'Pre-court hearing briefing time', hearingTime)

  assertHearingTime = (hearingTime: string) =>
    this.assertSummaryListValue('booking-details', 'Hearing time', hearingTime)

  assertPostHearingTime = (hearingTime: string) =>
    this.assertSummaryListValue('booking-details', 'Post-court hearing briefing time', hearingTime)
}
