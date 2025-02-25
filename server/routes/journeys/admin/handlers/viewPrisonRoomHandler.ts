import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'
import logger from '../../../../../logger'

export default class ViewPrisonRoomHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_PRISON_ROOM_PAGE

  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { prisonCode, dpsLocationId } = req.params

    const [prison, locationList] = await Promise.all([
      this.prisonService.getPrisonByCode(prisonCode, user),
      this.prisonService.getAppointmentLocations(prisonCode, true, user),
    ])

    const matchingRoom = locationList.filter(loc => loc.dpsLocationId === dpsLocationId)

    if (matchingRoom && matchingRoom.length > 0) {
      const room = matchingRoom[0]
      res.render('pages/admin/viewPrisonRoom', { prison, room })
    } else {
      res.redirect(`/view-prison-locations/${prisonCode}`)
    }
  }

  public POST = async (req: Request, res: Response) => {
    const { prisonCode, dpsLocationId, roomStatus, permission, videoUrl, notes } = req.body
    logger.info(
      `PrisonCode ${prisonCode}, dpsLocationId ${dpsLocationId}, status ${roomStatus}, permission ${permission}, URL ${videoUrl}, notes ${notes}`,
    )

    // TODO: Save the values here
    // TODO: Individual schedule rows saved separately?
    // TODO: Validation class for the input values above

    res.redirect(`/admin/view-prison-room/${prisonCode}/${dpsLocationId}`)
  }
}
