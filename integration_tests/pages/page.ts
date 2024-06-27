import { getDate, getMonth, getYear, parse } from 'date-fns'

export type PageElement = Cypress.Chainable

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  constructor(private readonly title: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')
  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  protected getByLabel: (label: string) => PageElement = (label: string) =>
    cy
      .contains('label', label)
      .invoke('attr', 'for')
      .then(id => cy.get(`#${id}`))

  protected selectDatePickerDate = (label: string, date: Date) => {
    cy.contains('label', label)
      .invoke('attr', 'for')
      .then(id => {
        cy.get(`#${id}`)
          .closest('.hmpps-datepicker-input__wrapper')
          .within(() => {
            cy.get('.hmpps-datepicker-button').click()

            const month = getMonth(date)
            const year = getYear(date)

            cy.get('.hmpps-datepicker__dialog__title').then($title => {
              const [currentMonthName, currentYearStr] = $title.text().trim().split(' ')
              const currentMonth = getMonth(parse(currentMonthName, 'MMMM', new Date()))
              const currentYear = +currentYearStr

              // Navigate years
              const yearDelta = year - currentYear
              if (yearDelta !== 0) {
                const yearButtonSelector = `.js-datepicker-${yearDelta > 0 ? 'next' : 'prev'}-year`
                for (let i = 0; i < Math.abs(yearDelta); i += 1) {
                  cy.get(yearButtonSelector).click()
                }
              }

              // Navigate months
              const monthDelta = month - currentMonth
              if (monthDelta !== 0) {
                const monthButtonSelector = `.js-datepicker-${monthDelta > 0 ? 'next' : 'prev'}-month`
                for (let i = 0; i < Math.abs(monthDelta); i += 1) {
                  cy.get(monthButtonSelector).click()
                }
              }
            })

            // Select day
            const day = getDate(date)
            cy.get('.hmpps-datepicker__dialog__table button:visible')
              .contains(new RegExp(`^${day}$`))
              .click()
          })
      })
  }

  protected selectTimePickerTime = (label: string, hour: number, minute: number) => {
    cy.contains('legend', label)
      .parent()
      .within(() => {
        cy.contains('label', 'Hour')
          .invoke('attr', 'for')
          .then(id => {
            cy.get(`#${id}`).select(hour.toString().padStart(2, '0'))
          })

        cy.contains('label', 'Minute')
          .invoke('attr', 'for')
          .then(id => {
            cy.get(`#${id}`).select(minute.toString().padStart(2, '0'))
          })
      })
  }

  protected getButton = (text: string): PageElement => cy.get('button, a').contains(text)
  protected getLink = (text: string): PageElement => cy.get('a').contains(text)
}
