import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'

export default class ConfirmationHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_CONFIRMATION_PAGE

  public GET = async (req: Request, res: Response) => {
    res.render('pages/bookAVideoLink/confirmation')
  }
}
