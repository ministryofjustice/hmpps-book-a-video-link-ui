import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchPrisonerPage extends AbstractPage {
  readonly header: Locator

  private readonly lastName: Locator

  readonly searchButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Search for a prisoner' })
    this.lastName = page.locator('#lastName')
    this.searchButton = page.getByRole('button', { name: 'Search' })
  }

  static async verifyOnPage(page: Page): Promise<SearchPrisonerPage> {
    const searchPrisonerPage = new SearchPrisonerPage(page)
    await expect(searchPrisonerPage.header).toBeVisible()
    await searchPrisonerPage.verifyNoAccessViolationsOnPage()
    return searchPrisonerPage
  }

  async enterLastName(lastName: string) {
    await this.lastName.fill(lastName)
  }
}
