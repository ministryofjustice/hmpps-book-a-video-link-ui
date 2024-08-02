import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'

export default class AdminHandler implements PageHandler {
  public PAGE_NAME = Page.ADMIN_PAGE
  GET = async (req: Request, res: Response) => res.render('pages/admin/admin')
}
