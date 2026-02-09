import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { parseDatePickerDate } from '../../../../utils/utils'
import VideoLinkService from '../../../../services/videoLinkService'

export default class PrintBookingsHandler implements PageHandler {
  public PAGE_NAME = Page.PRINT_BOOKINGS_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  GET = async (req: Request, res: Response) => {
    const type = req.routeContext.type as BavlJourneyType
    const { user, session } = res.locals

    if (!session?.journey?.viewMultipleAgencyBookingsJourney) {
      return res.redirect('/')
    }

    const fromDate = parseDatePickerDate(session.journey.viewMultipleAgencyBookingsJourney.fromDate as string)
    const toDate = parseDatePickerDate(session.journey.viewMultipleAgencyBookingsJourney.toDate as string)
    const agencyCode = session.journey.viewMultipleAgencyBookingsJourney.agencyCode as string
    const sort = session.journey.viewMultipleAgencyBookingsJourney.sort as string

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    const agencyCodes =
      agencyCode === 'ALL' ? agencies.map(a => a.code) : agencies.filter(a => a.code === agencyCode).map(a => a.code)

    const appointments =
      agencyCodes.length > 0
        ? await this.videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules(
            { agencyType: type, agencyCodes, fromDate, toDate, sort: this.getSortFields(type, sort) },
            user,
          )
        : []

    return res.render('pages/viewBooking/printBookings', { sort, agencies, appointments })
  }

  private getSortFields(type: BavlJourneyType, sortBy: string): string[] {
    if (sortBy === 'AGENCY_DATE_TIME') {
      const agency = type === BavlJourneyType.COURT ? 'courtDescription' : 'probationTeamDescription'
      return [agency, 'appointmentDate', 'startTime']
    }

    return ['appointmentDate', 'startTime']
  }
}
