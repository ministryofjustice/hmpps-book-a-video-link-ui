import Page, { PageElement } from '../page'

export default class SelectRoomsPage extends Page {
  constructor() {
    super('Select rooms for')
  }

  selectRoomForPreHearing = (room: string) => this.getByLabel('Select room for pre-court hearing briefing').select(room)

  selectRoomForMainHearing = (room: string) => this.getByLabel('Select room for court hearing').select(room)

  selectRoomForPostHearing = (room: string) =>
    this.getByLabel('Select room for post-court hearing briefing').select(room)

  continue = (): PageElement => this.getButton('Continue')
}
