import Page, { PageElement } from '../page'

export default class ManagePrisonDetailsPage extends Page {
  constructor() {
    super('Manage prison details')
  }

  managePrisonLink = (): PageElement => this.getLink('Manage prison')
}
