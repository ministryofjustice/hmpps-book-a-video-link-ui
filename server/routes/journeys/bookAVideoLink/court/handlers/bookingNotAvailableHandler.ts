import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CourtsService from '../../../../../services/courtsService'

export default class BookingNotAvailableHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_NOT_AVAILABLE_PAGE

  constructor(private readonly courtsService: CourtsService) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const courts = await this.courtsService.getUserPreferences(user)

    res.render('pages/bookAVideoLink/court/notAvailable', { courts })
  }
}
