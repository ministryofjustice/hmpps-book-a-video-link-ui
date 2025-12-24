import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ViewBookingPage extends AbstractPage {
  private readonly header: Locator

  readonly cancelVideoLinkButton: Locator

  readonly courtHearingTypeChangeLink: Locator

  readonly courtHearingDateChangeLink: Locator

  readonly courtHearingPreHearingRoomChangeLink: Locator

  readonly courtHearingTimeChangeLink: Locator

  readonly courtHearingRoomChangeLink: Locator

  readonly courtHearingCvpChangeLink: Locator

  readonly courtHearingGuestPinChangeLink: Locator

  readonly courtHearingPostHearingRoomChangeLink: Locator

  readonly staffNotesChangeLink: Locator

  readonly changeBookingDetailsButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Bob Smith’s video link details' })
    this.cancelVideoLinkButton = page.getByRole('button', { name: 'Cancel video link' })
    this.courtHearingTypeChangeLink = page.getByTestId('change-hearing-type')
    this.courtHearingDateChangeLink = page.getByTestId('change-court-date')
    this.courtHearingPreHearingRoomChangeLink = page.getByTestId('change-pre-location')
    this.courtHearingTimeChangeLink = page.getByTestId('change-court-time')
    this.courtHearingRoomChangeLink = page.getByTestId('change-location')
    this.courtHearingCvpChangeLink = page.getByTestId('change-video-url')
    this.courtHearingGuestPinChangeLink = page.getByTestId('change-guest-pin')
    this.courtHearingPostHearingRoomChangeLink = page.getByTestId('change-post-location')
    this.staffNotesChangeLink = page.getByTestId('change-notes')
    this.changeBookingDetailsButton = page.getByRole('button', { name: 'Change booking details' })
  }

  static async verifyOnPage(page: Page): Promise<ViewBookingPage> {
    const viewBookingPage = new ViewBookingPage(page)
    await expect(viewBookingPage.header).toBeVisible()
    await viewBookingPage.verifyNoAccessViolationsOnPage()
    return viewBookingPage
  }

  //
  // addComments = (): PageElement => this.getLink('Add comments')
  //
  // changeNotes = (): PageElement => cy.get(`[data-qa="change-notes"]`)
  //
  // changeBookingDetails = (): PageElement => this.getButton('Change booking details')
  //
  // cancelVideoLink = (): PageElement => this.getButton('Cancel video link')
  //
  // changeLinkFor = (key: string): PageElement =>
  //   cy
  //     .get('.govuk-summary-list__row')
  //     .contains('.govuk-summary-list__key', key)
  //     .parent()
  //     .find('.govuk-summary-list__actions .govuk-link')
}
