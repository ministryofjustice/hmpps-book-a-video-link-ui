import Page, { PageElement } from '../page'

export default class SearchBookingsPage extends Page {
  constructor() {
    super('Video link bookings')
  }

  selectDate = (date: Date) => this.selectDatePickerDate('Date', date)
  selectCourt = (court: string) => this.getByLabel('Court').select(court)
  selectProbationTeam = (team: string) => this.getByLabel('Probation team').select(team)
  updateResults = (): PageElement => this.getButton('Update results')
  viewOrEdit = (): PageElement => this.getLink('View or edit')
}
