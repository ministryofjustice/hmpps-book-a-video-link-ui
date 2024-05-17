import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import CourtsService from '../../../../services/courtsService'

export default class ConfirmationHandler implements PageHandler {
  constructor(private readonly courtsService: CourtsService) {}

  public PAGE_NAME = Page.MANAGE_COURTS_CONFIRMATION_PAGE

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const courts = await this.courtsService.getUserPreferences(user)

    res.render('pages/manageCourts/confirmation', { courts })
  }
}
