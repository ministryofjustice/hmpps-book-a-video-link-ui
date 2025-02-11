import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'

export default class BookingRequestedHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_REQUESTED_PAGE

  public GET = async (req: Request, res: Response) => {
    req.session.journey.bookAVideoLink = null
    res.render('pages/bookAVideoLink/probation/bookingRequested')
  }
}
