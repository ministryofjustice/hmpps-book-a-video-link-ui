import Page, { PageElement } from '../page'

export default class NotesForStaffPage extends Page {
  constructor() {
    super('Change notes on this booking')
  }

  enterNotesForStaff = (notesForStaff: string) =>
    this.getByLabel('Notes for prison staff (optional)').type(notesForStaff)

  continue = (): PageElement => this.getButton('Continue')
}
