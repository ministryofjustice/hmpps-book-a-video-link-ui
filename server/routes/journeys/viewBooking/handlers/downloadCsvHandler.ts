import * as converter from 'json-2-csv'
import { Request, Response } from 'express'
import { startOfDay, isValid } from 'date-fns'
import { PageHandler } from '../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import VideoLinkService from '../../../../services/videoLinkService'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import { convertToTitleCase, formatDate, parseDatePickerDate } from '../../../../utils/utils'
import { ScheduleItem } from '../../../../@types/bookAVideoLinkApi/types'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import CourtsService from '../../../../services/courtsService'

export default class DownloadCsvHandler implements PageHandler {
  public PAGE_NAME = Page.DOWNLOAD_BOOKINGS_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  GET = async (req: Request, res: Response) => {
    const type = req.params.type as BavlJourneyType
    const { user } = res.locals
    const dateFromQueryParam = parseDatePickerDate(req.query.date as string)
    const date = startOfDay(isValid(dateFromQueryParam) ? dateFromQueryParam : new Date())

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    const agencyCode = (req.query.agencyCode as string) || agencies[0].code
    const agency = agencies.find(a => a.code === agencyCode)
    const appointments = await this.videoLinkService.getVideoLinkSchedule(type, agencyCode, date, user)

    const csv = converter.json2csv(this.convertCourtAppointmentsToCsvRows(appointments))
    res.header('Content-Type', 'text/csv')
    res.attachment(`VideoLinkBookings-${formatDate(date, 'yyyy-MM-dd')}-${agency.description.split(' ').join('_')}.csv`)
    res.send(csv)
  }

  private convertCourtAppointmentsToCsvRows = (
    items: (ScheduleItem & { prisonerName: string; prisonLocationDescription: string })[],
  ) => {
    return items.map(a => ({
      'Appointment Start Time': a.startTime,
      'Appointment End Time': a.endTime,
      Prison: a.prisonName,
      'Prisoner name': convertToTitleCase(`${a.prisonerName}`),
      'Prisoner Number': a.prisonerNumber,
      'Hearing Type': a.hearingType,
      'Court Hearing Link': a.appointmentType === 'VLB_COURT_MAIN' && a.videoUrl ? a.videoUrl : '',
      'Room Hearing Link': a.appointmentType !== 'VLB_COURT_MAIN' && a.videoUrl ? a.videoUrl : '',
    }))
  }
}
