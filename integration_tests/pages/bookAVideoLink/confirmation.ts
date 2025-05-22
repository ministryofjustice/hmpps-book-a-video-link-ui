import Page from '../page'

export default class ConfirmationPage extends Page {
  constructor() {
    super('The video link has been booked')
  }

  assertNotesForStaff = (notesForStaff: string) =>
    this.assertSummaryListValue('confirmation-details', 'Notes for prison staff', notesForStaff)
}
