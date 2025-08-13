import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'
import { Location } from '../../../../@types/bookAVideoLinkApi/types'

export default class ViewPrisonsHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_PRISON_LIST_PAGE

  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const prisons = await this.prisonService.getPrisons(true, user)
    const prisonList = await Promise.all(
      prisons.map(async p => ({
        ...p,
        newRooms: await this.prisonService.getAppointmentLocations(p.code, true, user).then(rooms => this.new(rooms)),
      })),
    )

    res.render('pages/admin/viewPrisons', { prisonList })
  }

  // A room is considered new when it lacks extra attributes (i.e., undecorated).
  private new = (rooms: Location[]) => rooms.filter(r => r.extraAttributes == null).length
}
