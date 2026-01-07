import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class EditPrisonDetailsPage extends AbstractPage {
  private readonly header: Locator

  readonly saveButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'AA1 Prison for test' })
    this.saveButton = page.getByRole('button', { name: 'Save' })
  }

  static async verifyOnPage(page: Page): Promise<EditPrisonDetailsPage> {
    const editPrisonDetailsPage = new EditPrisonDetailsPage(page)
    await expect(editPrisonDetailsPage.header).toBeVisible()
    // // aria-allowed-attr is disabled because radio buttons can have aria-expanded which isn't
    // // currently allowed by the spec, but that might change: https://github.com/w3c/aria/issues/1404
    await editPrisonDetailsPage.verifyNoAccessViolationsOnPage(['aria-allowed-attr'])
    return editPrisonDetailsPage
  }

  selectPickUpTimeOn = () => this.page.getByTestId(`pick-up-time-on`)

  selectPickUpTime30 = () => this.page.getByTestId(`pick-up-time-30`)

  assertChangesSaved = () => expect(this.page.locator('.moj-alert__content')).toContainText('Changes have been saved')
}
