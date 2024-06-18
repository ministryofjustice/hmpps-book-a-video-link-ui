import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { parseDatePickerDate } from '../../../../utils/utils'

export default class ViewDailyBookingsHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_DAILY_BOOKINGS_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
  ) {}

  GET = async (req: Request, res: Response) => {
    const { type } = req.params
    const { user, validationErrors } = res.locals
    const date = parseDatePickerDate(req.query.date as string)
    const { agencyCode } = req.query

    if (date && !isValid(date) && !validationErrors) {
      return res.validationFailed(`An invalid date was entered: ${req.query.date}`, 'date')
    }

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    return res.render('pages/viewBooking/viewDailyBookings', { agencies })
  }
}