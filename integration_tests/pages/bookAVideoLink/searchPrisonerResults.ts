import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchPrisonerResultsPage extends AbstractPage {
  readonly header: Locator

  readonly prisonerNotListedLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Search for a prisoner results' })
    this.prisonerNotListedLink = page.getByRole('link', { name: 'The prisoner is not listed' })
  }

  static async verifyOnPage(page: Page): Promise<SearchPrisonerResultsPage> {
    const searchPrisonerResultsPage = new SearchPrisonerResultsPage(page)
    await expect(searchPrisonerResultsPage.header).toBeVisible()
    await searchPrisonerResultsPage.verifyNoAccessViolationsOnPage()
    return searchPrisonerResultsPage
  }

  async selectPrisoner(prisonerNumber: string) {
    await this.page.locator(`a[data-qa='${prisonerNumber}']`, { hasText: 'Book video link' }).click()
  }
}
