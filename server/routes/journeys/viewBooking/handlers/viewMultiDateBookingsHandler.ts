import { Request, Response } from 'express'
import { differenceInDays, formatDate, isValid, startOfToday } from 'date-fns'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { parseDatePickerDate } from '../../../../utils/utils'
import VideoLinkService from '../../../../services/videoLinkService'
import { PaginatedBookingsRequest } from '../../../../data/bookAVideoLinkApiClient'
import { Court, ProbationTeam } from '../../../../@types/bookAVideoLinkApi/types'

export default class ViewMultiDateBookingsHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_MULTIPLE_DATES_BOOKINGS_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  GET = async (req: Request, res: Response) => {
    const type = req.routeContext.type as BavlJourneyType
    const { user, validationErrors } = res.locals
    const fromDate = parseDatePickerDate(req.query.fromDate as string) || startOfToday()
    const toDate = parseDatePickerDate(req.query.toDate as string) || startOfToday()
    const page = req.query.page ? Number(req.query.page) : 1
    const sort = (req.query.sort as string) || 'AGENCY_DATE_TIME'

    // Validation is done like this due to being a GET and not a POST request
    if (fromDate && !isValid(fromDate) && !validationErrors) {
      return res.validationFailed(`An invalid from date was entered: ${req.query.fromDate}`, 'fromDate')
    }
    if (toDate && !isValid(toDate) && !validationErrors) {
      return res.validationFailed(`An invalid to date was entered: ${req.query.to}`, 'to')
    }
    if (toDate && fromDate && toDate < fromDate) {
      return res.validationFailed(`To date must be on or after from date`, 'toDate')
    }
    if (toDate && fromDate && differenceInDays(fromDate, toDate) > 30) {
      return res.validationFailed(`The to date must be a maximum of thirty days after the from date`, 'toDate')
    }

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    const agencyCode = this.getAgencyCode(req.query.agencyCode as string, agencies)
    const agencyCodes = agencyCode === 'ALL' ? agencies.map(a => a.code) : [agencyCode]

    const paginationRequest: PaginatedBookingsRequest = {
      agencyType: type,
      agencyCodes,
      fromDate,
      toDate: toDate || fromDate,
      pagination: { page: page - 1, size: 10, sort: this.getSortFields(type, sort) },
    }

    const appointments = await this.videoLinkService.getPaginatedMultipleAgenciesVideoLinkSchedules(
      paginationRequest,
      user,
    )
    const queryParams = new URLSearchParams({
      page: '{page}',
      agencyCode,
      fromDate: formatDate(fromDate, 'dd/MM/yyyy'),
      toDate: formatDate(toDate, 'dd/MM/yyyy'),
      sort,
    })

    req.session.journey ??= {}
    req.session.journey.viewMultipleAgencyBookingsJourney = {
      agencyCode,
      fromDate: formatDate(fromDate, 'dd/MM/yyyy'),
      toDate: formatDate(toDate, 'dd/MM/yyyy'),
      page: appointments.page.number + 1,
      sort,
    }

    return res.render('pages/viewBooking/viewMultiDateBookings', {
      agencies,
      appointments: appointments.content,
      pagination: {
        ...appointments.page,
        page: appointments.page.number + 1,
        hrefTemplate: `${req.originalUrl.split('?')[0]!}?${queryParams.toString()}`,
      },
    })
  }

  private getSortFields(type: BavlJourneyType, sortBy: string): string[] {
    if (sortBy === 'AGENCY_DATE_TIME') {
      const agency = type === BavlJourneyType.COURT ? 'courtDescription' : 'probationTeamDescription'
      return [agency, 'appointmentDate', 'startTime']
    }

    return ['appointmentDate', 'startTime']
  }

  private getAgencyCode(agencyCode: string | undefined, agencies: Court[] | ProbationTeam[]): string {
    if (agencyCode) {
      return agencyCode === 'ALL' && agencies.length > 1 ? 'ALL' : agencyCode
    }

    return agencies.length > 1 ? 'ALL' : agencies[0].code
  }
}
