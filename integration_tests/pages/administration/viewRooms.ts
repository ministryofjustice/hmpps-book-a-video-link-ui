import Page, { PageElement } from '../page'

export default class ViewRoomsPage extends Page {
  constructor() {
    super('Edit video link rooms at')
  }

  viewOrEditLink = (): PageElement => this.getLink('View or edit')
}
