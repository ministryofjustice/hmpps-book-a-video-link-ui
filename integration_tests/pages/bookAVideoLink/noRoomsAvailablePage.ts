import Page, { PageElement } from '../page'

export default class NoRoomsAvailablePage extends Page {
  constructor() {
    super('No bookings available')
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

  changeTimesButton = (): PageElement => this.getButton('Change times')
}
