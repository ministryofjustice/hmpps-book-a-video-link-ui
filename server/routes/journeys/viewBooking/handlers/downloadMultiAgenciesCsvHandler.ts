import * as converter from 'json-2-csv'
import { Request, Response } from 'express'
import { startOfDay, isValid, parse } from 'date-fns'
import _ from 'lodash'
import { enGB } from 'date-fns/locale'
import { PageHandler } from '../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import VideoLinkService from '../../../../services/videoLinkService'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import { convertToTitleCase, formatDate, parseDatePickerDate, toFullCourtLink } from '../../../../utils/utils'
import { ScheduleItem } from '../../../../@types/bookAVideoLinkApi/types'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import CourtsService from '../../../../services/courtsService'

export default class DownloadMultiAgenciesCsvHandler implements PageHandler {
  public PAGE_NAME = Page.DOWNLOAD_MULTIPLE_AGENCIES_BOOKINGS_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  GET = async (req: Request, res: Response) => {
    const type = req.routeContext.type as BavlJourneyType
    const { user } = res.locals
    const dateFromQueryParam = parseDatePickerDate(req.query.fromDate as string)
    const dateToQueryParam = parseDatePickerDate(req.query.toDate as string)
    const fromDate = startOfDay(isValid(dateFromQueryParam) ? dateFromQueryParam : new Date())
    const toDate = startOfDay(isValid(dateToQueryParam) ? dateToQueryParam : new Date())

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    const agencyCode = (req.query.agencyCode as string) || (agencies.length > 1 ? 'ALL' : agencies[0])
    const agencyCodes =
      agencyCode === 'ALL' ? agencies.map(a => a.code) : agencies.filter(a => a.code === agencyCode).map(a => a.code)
    const agency = agencies.find(a => a.code === agencyCode)
    const appointments = await this.videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules(
      { agencyType: type, agencyCodes, fromDate, toDate },
      user,
    )

    const csv =
      type === BavlJourneyType.COURT
        ? converter.json2csv(this.court(this.sorted(appointments)))
        : converter.json2csv(this.probationTeam(appointments))
    const filenameSuffix = agencyCode === 'ALL' ? `all-${type}` : agency.description.split(' ').join('_')

    res.header('Content-Type', 'text/csv')
    if (fromDate.getDate() === toDate.getDate()) {
      res.attachment(`VideoLinkBookings-${formatDate(fromDate, 'yyyy-MM-dd')}-${filenameSuffix}.csv`)
    } else {
      res.attachment(
        `VideoLinkBookings-${formatDate(fromDate, 'yyyy-MM-dd')}-to-${formatDate(toDate, 'yyyy-MM-dd')}-${filenameSuffix}.csv`,
      )
    }

    res.send(csv)
  }

  // Appointments need to first be grouped by booking ID and then sorted by (canonical) start time + prisoner name
  private sorted(appointments: ScheduleItem[]) {
    // This groups the appointments by booking ID, sorts them by start time and keys them by start time and prisoner name
    const groupedAppointments = _.chain(appointments)
      .groupBy(item => item.videoBookingId)
      .sortBy(groups => this.canonicalDateTime(groups[0].startTime))
      .keyBy(a => `${this.canonicalDateTime(a[0].startTime) + a[0].prisonerFirstName} ${a[0].prisonerLastName}`)
      .value()

    // This sorts the grouped appointments by their keys and then pulls them out in sorted bucket order. This ensures
    // appointments with the same starting time are grouped and ordered correctly.
    return _.keysIn(groupedAppointments)
      .sort()
      .map(canonicalKey => groupedAppointments[canonicalKey].flatMap(ga => ga))
      .flatMap(a => a)
  }

  private canonicalDateTime = (time: string): string =>
    (time ? parse(time, 'HH:mm', new Date(0), { locale: enGB }) : null).toISOString()

  private court = (items: ScheduleItem[]) => {
    return items.map(a => ({
      'Appointment Date': formatDate(a.appointmentDate, 'dd/MM/yyyy'),
      'Appointment Start Time': a.startTime,
      'Appointment End Time': a.endTime,
      Prison: a.prisonName,
      'Prisoner Name': convertToTitleCase(`${a.prisonerFirstName} ${a.prisonerLastName}`),
      'Prisoner Number': a.prisonerNumber,
      Court: a.courtDescription,
      'Appointment Type': this.courtAppointmentType(a.appointmentType),
      'Hearing Type': a.hearingTypeDescription,
      'Court Hearing Link': this.courtLinkFor(a) || '',
      'Room Hearing Link': a.appointmentType !== 'VLB_COURT_MAIN' && a.videoUrl ? a.videoUrl : '',
    }))
  }

  private courtAppointmentType(appointmentType: string) {
    if (appointmentType === 'VLB_COURT_MAIN') {
      return 'Court hearing'
    }

    if (appointmentType === 'VLB_COURT_PRE') {
      return 'Pre-hearing'
    }

    return 'Post-hearing'
  }

  private probationTeam = (items: ScheduleItem[]) => {
    return items.map(a => ({
      'Appointment Date': formatDate(a.appointmentDate, 'dd/MM/yyyy'),
      'Appointment Start Time': a.startTime,
      'Appointment End Time': a.endTime,
      Prison: a.prisonName,
      'Prisoner Name': convertToTitleCase(`${a.prisonerFirstName} ${a.prisonerLastName}`),
      'Prisoner Number': a.prisonerNumber,
      'Probation Team': a.probationTeamDescription,
      'Meeting Type': a.probationMeetingTypeDescription,
      'Room Hearing Link': a.videoUrl ? a.videoUrl : '',
      'Probation Officer Name': a.probationOfficerName ? a.probationOfficerName : '',
      'Email Address': a.probationOfficerEmailAddress ? a.probationOfficerEmailAddress : '',
    }))
  }

  private courtLinkFor = (item: ScheduleItem) => {
    if (item.appointmentType === 'VLB_COURT_MAIN') {
      if (item.videoUrl) {
        return item.videoUrl
      }
      if (item.hmctsNumber) {
        return toFullCourtLink(item.hmctsNumber)
      }
    }

    return undefined
  }
}
