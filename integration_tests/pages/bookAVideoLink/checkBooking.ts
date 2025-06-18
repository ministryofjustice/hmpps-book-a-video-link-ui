import Page, { PageElement } from '../page'

export default class CheckBookingPage extends Page {
  constructor() {
    super('Check and confirm your booking')
  }

  assertPrison = (prison: string) => this.assertSummaryListValue('booking-details', 'Prison', prison)

  assertCourt = (court: string) => this.assertSummaryListValue('booking-details', 'Court', court)

  assertDate = (date: string) => this.assertSummaryListValue('booking-details', 'Date', date)

  assertHearingLink = (link: string) => this.assertSummaryListValue('booking-details', 'Court hearing link (CVP)', link)

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

  bookVideoLink = (): PageElement => this.getButton('Book video link')

  updateBooking = (): PageElement => this.getButton('Update booking')

  changeLinkFor = (key: string): PageElement =>
    cy
      .get('.govuk-summary-list__row')
      .contains('.govuk-summary-list__key', key)
      .parent()
      .find('.govuk-summary-list__actions .govuk-link')
}
