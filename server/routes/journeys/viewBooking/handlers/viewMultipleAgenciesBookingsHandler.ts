import { Request, Response } from 'express'
import { formatDate, isValid, startOfToday } from 'date-fns'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { parseDatePickerDate } from '../../../../utils/utils'
import VideoLinkService from '../../../../services/videoLinkService'
import { PaginatedBookingsRequest } from '../../../../data/bookAVideoLinkApiClient'

export default class ViewMultipleAgenciesBookingsHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_MULTIPLE_AGENCIES_BOOKINGS_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  GET = async (req: Request, res: Response) => {
    const type = req.routeContext.type as BavlJourneyType
    const { user, validationErrors } = res.locals
    const date = parseDatePickerDate(req.query.date as string) || startOfToday()
    const page = req.query.page ? Number(req.query.page) : 1

    if (date && !isValid(date) && !validationErrors) {
      return res.validationFailed(`An invalid date was entered: ${req.query.date}`, 'date')
    }

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    const agencyCode = (req.query.agencyCode as string) || 'ALL'
    const agencyCodes = agencyCode === 'ALL' ? agencies.map(a => a.code) : [agencyCode]
    const paginationRequest: PaginatedBookingsRequest = {
      agencyType: type,
      agencyCodes,
      date,
      pagination: { page: page - 1, size: 10, sort: ['appointmentDate', 'startTime'] },
    }

    const appointments = await this.videoLinkService.getPaginatedMultipleAgenciesVideoLinkSchedules(
      paginationRequest,
      user,
    )
    const queryParams = new URLSearchParams({ page: '{page}', agencyCode, date: formatDate(date, 'dd-MM-yyyy') })

    return res.render('pages/viewBooking/viewMultipleAgenciesBookings', {
      agencies,
      appointments: appointments.content,
      pagination: {
        ...appointments.page,
        page: appointments.page.number + 1,
        hrefTemplate: `${req.originalUrl.split('?')[0]!}?${queryParams.toString()}`,
      },
    })
  }
}
