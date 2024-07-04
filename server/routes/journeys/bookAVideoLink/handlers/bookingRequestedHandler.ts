import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import PrisonService from '../../../../services/prisonService'
import VideoLinkService from '../../../../services/videoLinkService'

export default class BookingRequestedHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_REQUESTED_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly prisonService: PrisonService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { type } = req.params
    const { user } = res.locals
    const { prisoner } = req.session.journey.bookAVideoLink

    const agencies =
      type === 'court'
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    const rooms = await this.prisonService.getAppointmentLocations(prisoner.prisonId, user)

    const hearingTypes =
      type === 'court'
        ? await this.videoLinkService.getCourtHearingTypes(user)
        : await this.videoLinkService.getProbationMeetingTypes(user)

    // req.session.journey.bookAVideoLink = null

    res.render('pages/bookAVideoLink/bookingRequested', {
      prisoner,
      agencies,
      rooms,
      hearingTypes,
    })
  }
}
