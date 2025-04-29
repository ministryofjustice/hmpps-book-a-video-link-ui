import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { parseDatePickerDate } from '../../../../utils/utils'
import VideoLinkService from '../../../../services/videoLinkService'

export default class ViewDailyBookingsHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_DAILY_BOOKINGS_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  GET = async (req: Request, res: Response) => {
    const type = req.params.type as BavlJourneyType
    const { user, validationErrors } = res.locals
    const date = parseDatePickerDate(req.query.date as string)

    if (date && !isValid(date) && !validationErrors) {
      return res.validationFailed(`An invalid date was entered: ${req.query.date}`, 'date')
    }

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    const agencyCode = (req.query.agencyCode as string) || agencies[0].code
    const agency = agencies.find(a => a.code === agencyCode)

    const appointments = await this.videoLinkService.getVideoLinkSchedule(type, agencyCode, date, user)

    return res.render('pages/viewBooking/viewDailyBookings', { agency, agencies, appointments })
  }
}
