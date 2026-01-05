import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { formatDate } from '../../../server/utils/utils'

export default class EditRoomPage extends AbstractPage {
  private readonly header: Locator

  private readonly roomLink: Locator

  private readonly comments: Locator

  private readonly blockedFromDate: Locator

  private readonly blockedToDate: Locator

  readonly saveButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Video Room 01` })
    this.roomLink = page.getByLabel('Room link')
    this.comments = page.getByLabel('Comments (optional)')
    this.blockedFromDate = page.getByLabel('Date from')
    this.blockedToDate = page.getByLabel('Date to')
    this.saveButton = page.getByRole('button', { name: 'Save' })
  }

  static async verifyOnPage(page: Page): Promise<EditRoomPage> {
    const editRoomPage = new EditRoomPage(page)
    await expect(editRoomPage.header).toBeVisible()
    // // aria-allowed-attr is disabled because radio buttons can have aria-expanded which isn't
    // // currently allowed by the spec, but that might change: https://github.com/w3c/aria/issues/1404
    await editRoomPage.verifyNoAccessViolationsOnPage(['aria-allowed-attr'])
    return editRoomPage
  }

  enterRoomLink = (roomLink: string) => this.roomLink.fill(roomLink)

  enterComments = (comments: string) => this.comments.fill(comments)

  selectBlockedFromDate = (date: Date) => this.blockedFromDate.fill(formatDate(date, 'dd/MM/yyyy') as string)

  selectBlockedToDate = (date: Date) => this.blockedToDate.fill(formatDate(date, 'dd/MM/yyyy') as string)

  selectRoomStatus = (status: 'active' | 'inactive' | 'temporarily_blocked') =>
    this.page.locator(`input[name="roomStatus"][value="${status}"]`).check()

  assertRoomChangesSaved = () =>
    expect(this.page.locator('.moj-alert__content')).toContainText('Room changes have been saved')

  assertSelectedRoomStatus = (status: 'active' | 'inactive' | 'temporarily_blocked') =>
    expect(this.page.locator(`input[name="roomStatus"][value="${status}"]`)).toBeChecked()

  assertRoomLink = (roomLink: string) => expect(this.roomLink).toHaveValue(roomLink)

  assertSelectedRoomPermission = (permission: 'court' | 'probation' | 'shared' | 'schedule') =>
    expect(this.page.locator(`input[name="permission"][value="${permission}"]`)).toBeChecked()

  assertBlockedFromDate = (date: Date) =>
    expect(this.blockedFromDate).toContainText(formatDate(date, 'dd/MM/yyyy') as string)

  assertBlockedToDate = (date: Date) =>
    expect(this.blockedToDate).toContainText(formatDate(date, 'dd/MM/yyyy') as string)

  // getBlockedFromDate(): Cypress.Chainable<string> {
  //   return cy
  //     .get('input[name="blockedFrom"]')
  //     .invoke('val')
  //     .then(value => value as string)
  // }
  //
  // getBlockedToDate(): Cypress.Chainable<string> {
  //   return cy
  //     .get('input[name="blockedTo"]')
  //     .invoke('val')
  //     .then(value => value as string)
  // }
}
