import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'
import logger from '../../../../../logger'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import CourtsService from '../../../../services/courtsService'

export default class ViewPrisonRoomHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_PRISON_ROOM_PAGE

  constructor(
    private readonly prisonService: PrisonService,
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
  ) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { prisonCode, dpsLocationId } = req.params

    const [prison, locationList, courts, probationTeams] = await Promise.all([
      this.prisonService.getPrisonByCode(prisonCode, user),
      this.prisonService.getAppointmentLocations(prisonCode, true, user),
      this.courtsService.getAllEnabledCourts(user),
      this.probationTeamsService.getAllEnabledProbationTeams(user),
    ])

    const matchingRoom = locationList.filter(loc => loc.dpsLocationId === dpsLocationId)

    if (matchingRoom && matchingRoom.length > 0) {
      const room = matchingRoom[0]
      res.render('pages/admin/viewPrisonRoom', { prison, room, courts, probationTeams })
    } else {
      res.redirect(`/view-prison-locations/${prisonCode}`)
    }
  }

  public POST = async (req: Request, res: Response) => {
    const { prisonCode, dpsLocationId } = req.body
    // const { roomStatus, permission, courtCode, probationTeamCode, videoUrl, notes } = req.body
    // const { existingSchedule, scheduleStartDay, scheduleEndDay, schedulePermission, scheduleStartTime, scheduleEndTime } = req.body

    logger.info(`POST body is ${JSON.stringify(req.body, null, 2)}`)

    // TODO: Save the values here
    // TODO: Individual schedule rows saved separately?
    // TODO: Validation class for the input values above

    res.redirect(`/admin/view-prison-room/${prisonCode}/${dpsLocationId}`)
  }
}
