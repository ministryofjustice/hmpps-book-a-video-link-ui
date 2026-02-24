import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CourtsService from '../../../../../services/courtsService'
import TelemetryService from '../../../../../services/telemetryService'

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

    this.telemetryService.trackEvent('NoRoomsAvailableForCourtBooking', {
      bookingDate: date,
      prisonCode: prisoner?.prisonId,
      courtCode,
      preHearingStartTime,
      preHearingEndTime,
      startTime,
      endTime,
      postHearingStartTime,
      postHearingEndTime,
      username: user?.username,
    })

    res.render('pages/bookAVideoLink/court/notAvailable', { courts })
  }
}
