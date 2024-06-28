import Page, { PageElement } from '../page'

export default class NewBookingPage extends Page {
  constructor() {
    super('Search for a video link booking')
  }

  selectCourt = (court: string) => this.getByLabel('Which court is the hearing for?').select(court)
  selectProbationTeam = (team: string) => this.getByLabel('Which probation team is the meeting for?').select(team)
  selectHearingType = (type: string) => this.getByLabel('Which type of hearing is this?').select(type)
  selectMeetingType = (type: string) => this.getByLabel('Which type of meeting is this?').select(type)
  selectDate = (date: Date) => this.selectDatePickerDate('Date', date)
  selectStartTime = (hour, minute) => this.selectTimePickerTime('Start time', hour, minute)
  selectEndTime = (hour, minute) => this.selectTimePickerTime('End time', hour, minute)
  selectRoomForMainHearing = (room: string) => this.getByLabel('Prison room for court hearing').select(room)
  selectRoomForMeeting = (room: string) => this.getByLabel('Prison room for probation meeting').select(room)

  selectPreHearingRequired = (yesOrNo: string) =>
    cy
      .contains('legend', 'Do you want to add a pre-court hearing briefing?')
      .parent()
      .within(() => this.getByLabel(yesOrNo).click())

  selectRoomForPreHearing = (room: string) => this.getByLabel('Prison room for pre-court hearing briefing').select(room)

  selectPostHearingRequired = (yesOrNo: string) =>
    cy
      .contains('legend', 'Do you want to add a post-court hearing briefing?')
      .parent()
      .within(() => this.getByLabel(yesOrNo).click())

  selectRoomForPostHearing = (room: string) =>
    this.getByLabel('Prison room for post-court hearing briefing').select(room)

  continue = (): PageElement => this.getButton('Continue')
}
