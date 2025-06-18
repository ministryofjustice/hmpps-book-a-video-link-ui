import Page, { PageElement } from '../page'

export default class NewBookingPage extends Page {
  constructor() {
    super('Select a date and time for')
  }

  selectCourt = (court: string) => this.getByLabel('Select the court the hearing is for').select(court)

  selectHearingType = (type: string) => this.getByLabel('Select the court hearing type').select(type)

  selectCvpKnown = (yesOrNo: string) =>
    cy
      .contains('legend', 'Do you know the link for this video link hearing?')
      .parent()
      .within(() => this.getByLabel(yesOrNo).click())

  selectGuestPinKnown = (yesOrNo: string) =>
    cy
      .contains('legend', 'Is a guest pin required?')
      .parent()
      .within(() => this.getByLabel(yesOrNo).click())

  selectDate = (date: Date) => this.selectDatePickerDate('Date', date)

  selectStartTime = (hour, minute) => this.selectTimePickerTime('Start time', hour, minute)

  selectEndTime = (hour, minute) => this.selectTimePickerTime('End time', hour, minute)

  selectPreHearingRequired = (yesOrNo: string) =>
    cy
      .contains('legend', 'Do you want to add a pre-court hearing briefing?')
      .parent()
      .within(() => this.getByLabel(yesOrNo).click())

  selectPostHearingRequired = (yesOrNo: string) =>
    cy
      .contains('legend', 'Do you want to add a post-court hearing briefing?')
      .parent()
      .within(() => this.getByLabel(yesOrNo).click())

  enterNotesForStaff = (notesForStaff: string) =>
    this.getByLabel('Notes for prison staff (optional)').type(notesForStaff)

  continue = (): PageElement => this.getButton('Continue')
}
