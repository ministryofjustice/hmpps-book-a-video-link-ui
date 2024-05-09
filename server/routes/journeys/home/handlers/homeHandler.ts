import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'

export default class HomeHandler implements PageHandler {
  public PAGE_NAME = Page.HOME_PAGE

  async GET(req: Request, res: Response) {
    res.render('pages/home/home')
  }
}
