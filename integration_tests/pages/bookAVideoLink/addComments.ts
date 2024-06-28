import Page, { PageElement } from '../page'

export default class AddCommentsPage extends Page {
  constructor() {
    super('Add comments on this booking')
  }

  enterComments = (comment: string) => this.getByLabel('Comments (optional)').type(comment)
  continue = (): PageElement => this.getButton('Continue')
}
