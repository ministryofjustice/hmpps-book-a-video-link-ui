// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength } from 'class-validator'
import { parseISO } from 'date-fns'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CourtsService from '../../../../../services/courtsService'
import PrisonService from '../../../../../services/prisonService'
import VideoLinkService from '../../../../../services/videoLinkService'

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
    private readonly courtsService: CourtsService,
    private readonly prisonService: PrisonService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { mode } = req.params
    const { user } = res.locals
    const { bookAVideoLink } = req.session.journey
    const { prisoner, date, preHearingStartTime, startTime } = bookAVideoLink

    const { availabilityOk } = await this.videoLinkService.checkAvailability(bookAVideoLink, user)

    if (!availabilityOk) {
      return res.redirect('not-available')
    }

    const agencies = await this.courtsService.getUserPreferences(user)

    const rooms = await this.prisonService.getAppointmentLocations(prisoner.prisonId, false, user)

    const hearingTypes = await this.videoLinkService.getCourtHearingTypes(user)

    const warnPrison =
      mode !== 'request' &&
      this.videoLinkService.prisonShouldBeWarnedOfBooking(parseISO(date), parseISO(preHearingStartTime || startTime))

    return res.render('pages/bookAVideoLink/court/checkBooking', {
      warnPrison,
      prisoner,
      agencies,
      rooms,
      hearingTypes,
    })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { body } = req
    const { mode } = req.params

    req.session.journey.bookAVideoLink = {
      ...req.session.journey.bookAVideoLink,
      comments: body.comments,
    }

    const { availabilityOk } = await this.videoLinkService.checkAvailability(req.session.journey.bookAVideoLink, user)
    if (!availabilityOk) {
      return res.redirect('not-available')
    }

    if (mode === 'create') {
      const id = await this.videoLinkService.createVideoLinkBooking(req.session.journey.bookAVideoLink, user)
      return res.redirect(`confirmation/${id}`)
    }

    if (mode === 'amend') {
      await this.videoLinkService.amendVideoLinkBooking(req.session.journey.bookAVideoLink, user)
    }

    if (mode === 'request') {
      await this.videoLinkService.requestVideoLinkBooking(req.session.journey.bookAVideoLink, user)
    }

    return res.redirect(`confirmation`)
  }
}
