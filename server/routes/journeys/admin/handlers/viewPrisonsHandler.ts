import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'

export default class ViewPrisonsHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_PRISON_LIST_PAGE

  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const prisonList = await this.prisonService.getPrisons(true, user)
    res.render('pages/admin/viewPrisons', { prisonList })
  }
}
