import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { formatDate } from '../../../server/utils/utils'

export default class BookingDetailsPage extends AbstractPage {
  private readonly header: Locator

  private readonly probationTeam: Locator

  private readonly probationOfficerName: Locator

  private readonly probationOfficerEmail: Locator

  private readonly probationMeetingType: Locator

  private readonly date: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Enter probation video link booking details for` })
    this.probationTeam = page.getByLabel('Select probation team')
    this.probationOfficerName = page.getByLabel('Full name')
    this.probationOfficerEmail = page.getByLabel('Email address')
    this.probationMeetingType = page.getByLabel('Select meeting type')
    this.date = page.getByLabel('Date')
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<BookingDetailsPage> {
    const bookingDetailsPage = new BookingDetailsPage(page)
    await expect(bookingDetailsPage.header).toBeVisible()
    await bookingDetailsPage.verifyNoAccessViolationsOnPage()
    return bookingDetailsPage
  }

  async selectProbationTeam(probationTeam: string) {
    await this.probationTeam.selectOption(probationTeam)
  }

  async enterProbationOfficerName(name: string) {
    await this.probationOfficerName.fill(name)
  }

  async enterProbationOfficerEmail(email: string) {
    await this.probationOfficerEmail.fill(email)
  }

  async selectProbationMeetingType(probationMeetingType: string) {
    await this.probationMeetingType.selectOption(probationMeetingType)
  }

  async selectDate(date: Date) {
    await this.date.fill(formatDate(date, 'dd/MM/yyyy') as string)
  }

  async selectStartTime(hour: number, minute: number) {
    await this.selectTime('start', hour, minute)
  }

  async selectEndTime(hour: number, minute: number) {
    await this.selectTime('end', hour, minute)
  }
  //
  // selectDuration = (duration: string) =>
  //   cy
  //     .contains('legend', 'Select meeting duration')
  //     .parent()
  //     .within(() => this.getByLabel(duration).click())
  //
  // selectTimePeriods = (timePeriods: string[]) =>
  //   cy
  //     .contains('legend', 'Select time period')
  //     .parent()
  //     .within(() => timePeriods.forEach(p => this.getByLabel(p).click()))
  //
  //
  // enterNotesForStaff = (notesForStaff: string) =>
  //   this.getByLabel('Notes for prison staff (optional)').type(notesForStaff)
  //
  // continue = (): PageElement => this.getButton('Continue')
}
