import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class NotesForStaffPage extends AbstractPage {
  readonly header: Locator

  readonly notesForStaff: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Change notes on this booking' })
    this.notesForStaff = page.getByLabel('Notes for prison staff (optional)')
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<NotesForStaffPage> {
    const notesForStaffPage = new NotesForStaffPage(page)
    await expect(notesForStaffPage.header).toBeVisible()
    await notesForStaffPage.verifyNoAccessViolationsOnPage()
    return notesForStaffPage
  }

  enterNotesForStaff = async (notesForStaff: string) => this.notesForStaff.fill(notesForStaff)
}
