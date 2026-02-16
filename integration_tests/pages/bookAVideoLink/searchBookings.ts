import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { formatDate } from '../../../server/utils/utils'

export default class SearchBookingsPage extends AbstractPage {
  readonly header: Locator

  private readonly fromDate: Locator

  private readonly toDate: Locator

  private readonly agencyCode: Locator

  readonly updateResultsButton: Locator

  readonly viewOrEditLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Video link bookings' })
    this.fromDate = page.locator('#fromDate')
    this.toDate = page.locator('#toDate')
    this.agencyCode = page.locator('#agencyCode')
    this.updateResultsButton = page.getByRole('button', { name: 'Update results' })
    this.viewOrEditLink = page.getByRole('link', { name: 'View or edit' })
  }

  static async verifyOnPage(page: Page): Promise<SearchBookingsPage> {
    const searchBookingsPage = new SearchBookingsPage(page)
    await expect(searchBookingsPage.header).toBeVisible()
    await searchBookingsPage.verifyNoAccessViolationsOnPage()
    return searchBookingsPage
  }

  async selectFromAndToDate(from: Date, to: Date) {
    await this.fromDate.fill(formatDate(from, 'dd/MM/yyyy') as string)
    await this.toDate.fill(formatDate(to, 'dd/MM/yyyy') as string)
  }

  async selectCourt(court: string) {
    await this.agencyCode.selectOption(court)
  }

  async selectProbationTeam(probationTeam: string) {
    await this.agencyCode.selectOption(probationTeam)
  }
}
