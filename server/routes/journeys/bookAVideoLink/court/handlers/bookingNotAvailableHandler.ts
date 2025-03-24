import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CourtsService from '../../../../../services/courtsService'
import PrisonerService from '../../../../../services/prisonerService'

export default class BookingNotAvailableHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_NOT_AVAILABLE_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly prisonerService: PrisonerService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const courts = await this.courtsService.getUserPreferences(user)

    res.render('pages/bookAVideoLink/court/notAvailable', { courts })
  }

  public POST = async (req: Request, res: Response) => {
    // Remove rooms from the session object - need to alter times and select new
    req.session.journey.bookACourtHearing = {
      ...req.session.journey.bookACourtHearing,
      locationCode: undefined,
      preLocationCode: undefined,
      postLocationCode: undefined,
    }
    return res.redirect('../video-link-booking')
  }
}
