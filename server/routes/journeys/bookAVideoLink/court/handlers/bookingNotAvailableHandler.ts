import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CourtsService from '../../../../../services/courtsService'
import PrisonerService from '../../../../../services/prisonerService'
import { formatDate } from '../../../../../utils/utils'

export default class BookingNotAvailableHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_NOT_AVAILABLE_PAGE

  constructor(
    private readonly courtsService: CourtsService,
    private readonly prisonerService: PrisonerService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { mode } = req.params

    const journey = req.session.journey.bookACourtHearing

    const offender = journey?.prisoner
    const prisonerNumber = req.params.prisonerNumber || offender.prisonerNumber
    const courts = await this.courtsService.getUserPreferences(user)
    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    const preReq = journey?.preHearingStartTime !== undefined
    const postReq = journey?.postHearingStartTime !== undefined

    const preTimes = preReq ? this.formatTimes(journey.preHearingStartTime, journey.preHearingEndTime) : undefined
    const mainTimes = this.formatTimes(journey.startTime, journey.endTime)
    const postTimes = postReq ? this.formatTimes(journey.postHearingStartTime, journey.postHearingEndTime) : undefined

    res.render('pages/bookAVideoLink/court/notAvailable', {
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        dateOfBirth: prisoner.dateOfBirth,
        prisonerNumber: prisoner.prisonerNumber,
        prisonName: prisoner.prisonName,
      },
      courts,
      mainTimes,
      preTimes,
      postTimes,
      fromReview: req.get('Referrer')?.endsWith('check-booking'),
    })
  }

  public POST = async (req: Request, res: Response) => {
    // Remove rooms from the session object - need to alter times and select new
    req.session.journey.bookACourtHearing = {
      ...req.session.journey.bookACourtHearing,
      locationCode: undefined,
      preLocationCode: undefined,
      postLocationCode: undefined,
    }
    return res.redirect('../video-link-booking')
  }

  // Should be utils..
  private formatTimes = (startTime: string, endTime: string): string => {
    return `${formatDate(startTime, 'HH:mm')} to ${formatDate(endTime, 'HH:mm')}`
  }
}
