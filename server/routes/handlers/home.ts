import { Request, Response } from 'express'
import { Page } from '../../services/auditService'
import { PageHandler } from './interfaces/pageHandler'

export default class HomeHandler implements PageHandler {
  public PAGE_NAME = Page.EXAMPLE_PAGE

  GET = async (req: Request, res: Response): Promise<void> => res.render('pages/home')
}
