import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class PrisonerDetailsPage extends AbstractPage {
  readonly header: Locator

  private readonly firstName: Locator

  private readonly lastName: Locator

  private readonly dateOfBirthDay: Locator

  private readonly dateOfBirthMonth: Locator

  private readonly dateOfBirthYear: Locator

  private readonly prison: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Who is the video link for?' })
    this.firstName = page.getByLabel('First name')
    this.lastName = page.getByLabel('Last name')
    this.dateOfBirthDay = page.getByLabel('Day')
    this.dateOfBirthMonth = page.getByLabel('Month')
    this.dateOfBirthYear = page.getByLabel('Year')
    this.prison = page.getByLabel('Prison')
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<PrisonerDetailsPage> {
    const prisonerDetailsPage = new PrisonerDetailsPage(page)
    await expect(prisonerDetailsPage.header).toBeVisible()
    await prisonerDetailsPage.verifyNoAccessViolationsOnPage()
    return prisonerDetailsPage
  }

  async enterFirstName(firstName: string) {
    await this.firstName.fill(firstName)
  }

  async enterLastName(lastName: string) {
    await this.lastName.fill(lastName)
  }

  async enterDateOfBirth(day: string, month: string, year: string) {
    await this.dateOfBirthDay.fill(day)
    await this.dateOfBirthMonth.fill(month)
    await this.dateOfBirthYear.fill(year)
  }

  async selectPrison(prison: string) {
    await this.prison.selectOption(prison)
  }
}
