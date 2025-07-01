import Page, { PageElement } from '../page'

export default class ManagePrisonVideoRoomsPage extends Page {
  constructor() {
    super("Manage a prison's video link rooms")
  }

  manageRoomsLink = (): PageElement => this.getLink('Manage rooms')
}
