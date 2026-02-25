import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CourtsService from '../../../../../services/courtsService'
import TelemetryService from '../../../../../services/telemetryService'
import { formatDate } from '../../../../../utils/utils'

export default class BookingNotAvailableHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_NOT_AVAILABLE_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly telemetryService: TelemetryService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { bookACourtHearing } = req.session.journey
    const {
      prisoner,
      date,
      courtCode,
      preHearingStartTime,
      preHearingEndTime,
      startTime,
      endTime,
      postHearingStartTime,
      postHearingEndTime,
    } = bookACourtHearing

    const courts = await this.courtsService.getUserPreferences(user)

    const eventToRecord = {
      bookingDate: formatDate(date, 'yyyy-MM-dd'),
      prisonCode: prisoner?.prisonId,
      courtCode,
      preHearingStartTime: formatDate(preHearingStartTime, 'HH:mm'),
      preHearingEndTime: formatDate(preHearingEndTime, 'HH:mm'),
      startTime: formatDate(startTime, 'HH:mm'),
      endTime: formatDate(endTime, 'HH:mm'),
      postHearingStartTime: formatDate(postHearingStartTime, 'HH:mm'),
      postHearingEndTime: formatDate(postHearingEndTime, 'HH:mm'),
      username: user?.username,
    }

    this.telemetryService.trackEvent('NoRoomsAvailableForCourtBooking', eventToRecord)

    res.render('pages/bookAVideoLink/court/notAvailable', { courts })
  }
}
