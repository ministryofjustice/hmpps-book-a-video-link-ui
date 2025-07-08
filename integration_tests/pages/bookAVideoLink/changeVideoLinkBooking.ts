import Page, { PageElement } from '../page'

export default class ChangeVideoLinkBookingPage extends Page {
  constructor() {
    super('Change')
  }

  selectHearingType = (type: string) => this.getByLabel('Select the court hearing type').select(type)

  selectCvpKnown = (yesOrNo: string) =>
    cy
      .contains('legend', 'Do you know the video link for this hearing?')
      .parent()
      .within(() => this.getByLabel(yesOrNo).click())

  enterHearingLink = (link: string) => this.getByLabel('Enter number from CVP address').clear().type(link)

  enterFullWebAddress = (link: string) => this.getByLabel('Enter full web address (URL)').clear().type(link)

  clearFullWebAddress = () => this.getByLabel('Enter full web address (URL)').clear()

  continue = (): PageElement => this.getButton('Continue')
}
