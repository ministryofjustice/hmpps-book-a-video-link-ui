import Page, { PageElement } from '../page'

export default class ExtractDataByBookingDatePage extends Page {
  constructor() {
    super('Extract summary data by booking date')
  }

  selectCourt = () => this.getByLabel('Court').click()

  selectProbation = () => this.getByLabel('Probation').click()

  selectDate = (date: Date) => this.selectDatePickerDate('Start date', date)

  enterNumberOfDays = (numberOfDays: number) =>
    this.getByLabel('Enter a number of days from the start date').type(numberOfDays.toString())

  extractData = (): PageElement => this.getButton('Extract data')
}
