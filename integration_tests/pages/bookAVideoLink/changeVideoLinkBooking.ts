import Page, { PageElement } from '../page'

export default class ChangeVideoLinkBookingPage extends Page {
  constructor() {
    super('Change')
  }

  selectHearingType = (type: string) => this.getByLabel('Select the court hearing type').select(type)

  selectCvpKnown = (yesOrNo: string) =>
    cy
      .contains('legend', 'Do you know the link for this video link hearing?')
      .parent()
      .within(() => this.getByLabel(yesOrNo).click())

  enterHearingLink = (link: string) => this.getByLabel('Court hearing link').type(link)

  continue = (): PageElement => this.getButton('Continue')
}
