// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength } from 'class-validator'
import { parseISO } from 'date-fns'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ProbationTeamsService from '../../../../../services/probationTeamsService'
import PrisonService from '../../../../../services/prisonService'
import VideoLinkService from '../../../../../services/videoLinkService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import ProbationBookingService from '../../../../../services/probationBookingService'
import config from '../../../../../config'

class Body {
  @Expose()
  @IsOptional()
  @MaxLength(400, { message: 'Comments must be $constraint1 characters or less' })
  comments: string
}

export default class CheckBookingHandler implements PageHandler {
  public PAGE_NAME = Page.CHECK_BOOKING_PAGE

  public BODY = Body

  constructor(
    private readonly probationBookingService: ProbationBookingService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly prisonService: PrisonService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { mode } = req.params
    const { user } = res.locals
    const { bookAProbationMeeting } = req.session.journey
    const { prisoner, date, startTime } = bookAProbationMeeting

    const { availabilityOk } = await this.probationBookingService.checkAvailability(bookAProbationMeeting, user)

    if (!availabilityOk) {
      return res.redirect(config.featureToggles.enhancedProbationJourneyEnabled ? 'availability' : 'not-available')
    }

    const probationTeams = await this.probationTeamsService.getUserPreferences(user)

    const rooms = await this.prisonService.getAppointmentLocations(prisoner.prisonId, false, user)

    const meetingTypes = await this.referenceDataService.getProbationMeetingTypes(user)

    const warnPrison =
      mode !== 'request' && this.videoLinkService.prisonShouldBeWarnedOfBooking(parseISO(date), parseISO(startTime))

    return res.render('pages/bookAVideoLink/probation/checkBooking', {
      warnPrison,
      prisoner,
      probationTeams,
      rooms,
      meetingTypes,
    })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { body } = req
    const { mode } = req.params

    req.session.journey.bookAProbationMeeting = {
      ...req.session.journey.bookAProbationMeeting,
      comments: body.comments,
    }

    const { availabilityOk } = await this.probationBookingService.checkAvailability(
      req.session.journey.bookAProbationMeeting,
      user,
    )
    if (!availabilityOk) {
      return res.redirect(config.featureToggles.enhancedProbationJourneyEnabled ? 'availability' : 'not-available')
    }

    if (mode === 'create') {
      const id = await this.probationBookingService.createVideoLinkBooking(
        req.session.journey.bookAProbationMeeting,
        user,
      )
      return res.redirect(`confirmation/${id}`)
    }

    if (mode === 'amend') {
      await this.probationBookingService.amendVideoLinkBooking(req.session.journey.bookAProbationMeeting, user)
    }

    if (mode === 'request') {
      await this.probationBookingService.requestVideoLinkBooking(req.session.journey.bookAProbationMeeting, user)
    }

    return res.redirect(`confirmation`)
  }
}
