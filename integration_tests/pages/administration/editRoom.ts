import Page, { PageElement } from '../page'

export default class EditRoomPage extends Page {
  constructor() {
    super('Video Room 01')
  }

  roomLink = (): PageElement => this.getByLabel('Room link')

  comments = (): PageElement => this.getByLabel('Comments (optional)')

  save = (): PageElement => this.getButton('Save')

  getSelectedRoomStatus(): Cypress.Chainable<string> {
    return cy
      .get('input[name="roomStatus"]:checked')
      .invoke('val')
      .then(value => value as string)
  }

  selectRoomStatus(status: 'active' | 'inactive'): PageElement {
    return cy.get(`input[name="roomStatus"][value="${status}"]`).check()
  }

  getSelectedRoomPermission(): Cypress.Chainable<string> {
    return cy
      .get('input[name="permission"]:checked')
      .invoke('val')
      .then(value => value as string)
  }
}
