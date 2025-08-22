import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'
import { Location } from '../../../../@types/bookAVideoLinkApi/types'

export default class ViewPrisonDetailsHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_PRISON_DETAILS_PAGE

  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const prisons = await this.prisonService.getPrisons(false, user)

    res.render('pages/admin/viewPrisonDetails', { prisons })
  }

  // A room is considered new when it lacks extra attributes (i.e., undecorated).
  private new = (rooms: Location[]) => rooms.filter(r => r.extraAttributes == null).length
}
