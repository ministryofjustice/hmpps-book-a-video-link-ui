import Page, { PageElement } from '../page'

export default class PrisonerNotListedPage extends Page {
  constructor() {
    super('You can request a video link booking for a prisoner')
  }

  continue = (): PageElement => this.getButton('Continue')
}
