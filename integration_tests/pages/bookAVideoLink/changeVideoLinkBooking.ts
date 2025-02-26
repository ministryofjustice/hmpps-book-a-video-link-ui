import Page, { PageElement } from '../page'

export default class ChangeVideoLinkBookingPage extends Page {
  constructor() {
    super('Change video link booking')
  }

  selectRoomForMainHearing = (room: string) => this.getByLabel('Prison room for court hearing').select(room)

  selectRoomForPreHearing = (room: string) => this.getByLabel('Prison room for pre-court hearing briefing').select(room)

  selectRoomForPostHearing = (room: string) =>
    this.getByLabel('Prison room for post-court hearing briefing').select(room)

  continue = (): PageElement => this.getButton('Continue')
}
