import Page, { PageElement } from '../page'

export default class LocationAvailabilityPage extends Page {
  constructor() {
    super('Available bookings')
  }

  selectSlot = (slot: string) => this.getByLabel(slot).click()

  continue = (): PageElement => this.getButton('Continue')
}
