import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import VideoLinkService from '../../../../../services/videoLinkService'

export default class ConfirmCancelHandler implements PageHandler {
  public PAGE_NAME = Page.CONFIRM_CANCEL_PAGE

  constructor(private readonly videoLinkService: VideoLinkService) {}

  public GET = async (req: Request, res: Response) => res.render('pages/bookAVideoLink/probation/confirmCancel')

  public POST = async (req: Request, res: Response) => {
    await this.videoLinkService.cancelVideoLinkBooking(+req.params.bookingId, res.locals.user)
    return res.redirect(`confirmation`)
  }
}
