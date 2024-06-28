import Page, { PageElement } from '../page'

export default class SearchPrisonerPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  enterLastName = (lastName: string) => this.getByLabel('Last name').type(lastName)
  search = (): PageElement => this.getButton('Search')
}
