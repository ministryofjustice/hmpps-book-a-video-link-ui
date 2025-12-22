import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { formatDate } from '../../../server/utils/utils'

export default class SearchBookingsPage extends AbstractPage {
  readonly header: Locator

  readonly date: Locator

  readonly agencyCode: Locator

  readonly updateResultsButton: Locator

  readonly viewOrEditLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Video link bookings' })
    this.date = page.locator('#date')
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

  async selectDate(date: Date) {
    await this.date.fill(formatDate(date, 'dd/MM/yyyy') as string)
  }

  async selectCourt(court: string) {
    await this.agencyCode.selectOption(court)
  }

  async selectProbationTeam(probationTeam: string) {
    await this.agencyCode.selectOption(probationTeam)
  }

  // selectCourt = (court: string) => this.getByLabel('Court').select(court)
  //
  // selectProbationTeam = (team: string) => this.getByLabel('Probation team').select(team)
  //
  // updateResults = (): PageElement => this.getButton('Update results')
  //
  // viewOrEdit = (): PageElement => this.getLink('View or edit')
}
