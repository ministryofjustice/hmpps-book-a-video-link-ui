import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'

export default class ViewPrisonRoomHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_PRISON_ROOM_PAGE

  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { prisonCode, dpsLocationId } = req.params

    const [prison, locationList] = await Promise.all([
      this.prisonService.getPrisonByCode(prisonCode, user),
      this.prisonService.getDecoratedAppointmentLocations(prisonCode, true, true, user),
    ])

    const matchingRoom = locationList.filter(loc => loc.dpsLocationId === dpsLocationId)

    if (matchingRoom && matchingRoom.length > 0) {
      const room = matchingRoom[0]
      res.render('pages/admin/viewPrisonRoom', { prison, room })
    } else {
      res.redirect(`/view-prison-locations/$prisonCode`)
    }
  }
}
