import Page, { PageElement } from '../page'

export default class CheckRequestPage extends Page {
  constructor() {
    super('Check and confirm your request')
  }

  requestVideoLink = (): PageElement => this.getButton('Request video link')
}
