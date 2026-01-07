import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CheckBookingPage extends AbstractPage {
  private readonly header: Locator

  readonly bookVideoLinkButton: Locator

  readonly courtHearingTypeChangeLink: Locator

  readonly courtHearingDateChangeLink: Locator

  readonly courtHearingPreHearingRoomChangeLink: Locator

  readonly courtHearingTimeChangeLink: Locator

  readonly courtHearingRoomChangeLink: Locator

  readonly courtHearingCvpChangeLink: Locator

  readonly courtHearingGuestPinChangeLink: Locator

  readonly courtHearingPostHearingRoomChangeLink: Locator

  readonly courtHearingStaffNotesChangeLink: Locator

  readonly updateBookingButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Check and confirm your booking' })
    this.bookVideoLinkButton = page.getByRole('button', { name: 'Book video link' })
    this.courtHearingTypeChangeLink = page.getByTestId('change-link-hearing-type')
    this.courtHearingDateChangeLink = page.getByTestId('change-link-hearing-date')
    this.courtHearingPreHearingRoomChangeLink = page.getByTestId('change-link-pre-hearing-room')
    this.courtHearingTimeChangeLink = page.getByTestId('change-link-hearing-time')
    this.courtHearingRoomChangeLink = page.getByTestId('change-link-hearing-room')
    this.courtHearingCvpChangeLink = page.getByTestId('change-link-cvp')
    this.courtHearingGuestPinChangeLink = page.getByTestId('change-link-guest-pin')
    this.courtHearingPostHearingRoomChangeLink = page.getByTestId('change-link-post-hearing-room')
    this.courtHearingStaffNotesChangeLink = page.getByTestId('change-link-staff-notes')
    this.updateBookingButton = page.getByRole('button', { name: 'Update booking' })
  }

  static async verifyOnPage(page: Page): Promise<CheckBookingPage> {
    const checkBookingPage = new CheckBookingPage(page)
    await expect(checkBookingPage.header).toBeVisible()
    await checkBookingPage.verifyNoAccessViolationsOnPage()
    return checkBookingPage
  }

  assertPrison = (prison: string) => this.assertSummaryListValue('booking-details', 'Prison', prison)

  assertCourt = (court: string) => this.assertSummaryListValue('booking-details', 'Court', court)

  assertDate = (date: string) => this.assertSummaryListValue('booking-details', 'Date', date)

  assertHearingLink = (link: string) =>
    this.assertSummaryListValue('booking-details', 'Court hearing link (CVP)', link.trim())

  assertHearingType = (hearingType: string) =>
    this.assertSummaryListValue('booking-details', 'Hearing type', hearingType)

  assertPreHearingTime = (hearingTime: string) =>
    this.assertSummaryListValue('booking-details', 'Pre-court hearing time', hearingTime)

  assertHearingTime = (hearingTime: string) =>
    this.assertSummaryListValue('booking-details', 'Court hearing time', hearingTime)

  assertHearingRoom = (hearingRoom: string) =>
    this.assertSummaryListValue('booking-details', 'Court hearing room', hearingRoom)

  assertPostHearingTime = (hearingTime: string) =>
    this.assertSummaryListValue('booking-details', 'Post-court hearing time', hearingTime)

  assertNotesForStaff = (notesForStaff: string) =>
    this.assertSummaryListValue('booking-details', 'Notes for prison staff', notesForStaff)
}
