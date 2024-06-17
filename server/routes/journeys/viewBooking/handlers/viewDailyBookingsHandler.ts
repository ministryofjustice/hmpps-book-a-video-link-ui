import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'

export default class ViewDailyBookingsHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_DAILY_BOOKINGS_PAGE

  GET = async (req: Request, res: Response) => {
    res.render('pages/viewBooking/viewDailyBookings')
  }
}
