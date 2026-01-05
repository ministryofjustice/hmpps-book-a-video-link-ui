import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { formatDate } from '../../../server/utils/utils'

export default class NewBookingPage extends AbstractPage {
  readonly header: Locator

  private readonly court: Locator

  private readonly courtHearingType: Locator

  private readonly date: Locator

  private readonly notesForStaff: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Select a date and time for` })
    this.court = page.getByLabel('Select the court the hearing is for')
    this.courtHearingType = page.getByLabel('Select the court hearing type')
    this.date = page.getByLabel('Date')
    this.notesForStaff = page.getByLabel('Notes for prison staff (optional)')
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<NewBookingPage> {
    const newBookingPage = new NewBookingPage(page)
    await expect(newBookingPage.header).toBeVisible()
    // // aria-allowed-attr is disabled because radio buttons can have aria-expanded which isn't
    // // currently allowed by the spec, but that might change: https://github.com/w3c/aria/issues/1404
    await newBookingPage.verifyNoAccessViolationsOnPage(['aria-allowed-attr'])
    return newBookingPage
  }

  async selectCourt(court: string) {
    await this.court.selectOption(court)
  }

  async selectCourtHearingType(courtHearingType: string) {
    await this.courtHearingType.selectOption(courtHearingType)
  }

  async selectCvpKnown(yesOrNo: string) {
    if (yesOrNo === 'Yes') {
      await this.page.locator('#cvpRequired').check()
    }

    if (yesOrNo === 'No') {
      await this.page.locator('#cvpRequired-2').check()
    }
  }

  async selectGuestPinKnown(yesOrNo: string) {
    if (yesOrNo === 'Yes') {
      await this.page.locator('#guestPinRequired').check()
    }

    if (yesOrNo === 'No') {
      await this.page.locator('#guestPinRequired-2').check()
    }
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

  async selectPreHearingRequired(yesOrNo: 'Yes' | 'No') {
    if (yesOrNo === 'Yes') {
      await this.page.locator('#preRequired').check()
    }

    if (yesOrNo === 'No') {
      await this.page.locator('#preRequired-2').check()
    }
  }

  async selectPostHearingRequired(yesOrNo: 'Yes' | 'No') {
    if (yesOrNo === 'Yes') {
      await this.page.locator('#postRequired').check()
    }

    if (yesOrNo === 'No') {
      await this.page.locator('#postRequired-2').check()
    }
  }

  async enterNotesForStaff(notesForStaff: string) {
    await this.notesForStaff.fill(notesForStaff)
  }
}
