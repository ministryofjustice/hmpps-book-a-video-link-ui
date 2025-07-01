// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength, ValidateIf } from 'class-validator'
import { parseISO } from 'date-fns'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CourtsService from '../../../../../services/courtsService'
import PrisonService from '../../../../../services/prisonService'
import VideoLinkService from '../../../../../services/videoLinkService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import CourtBookingService from '../../../../../services/courtBookingService'

class Body {
  @Expose()
  @ValidateIf(o => o.notesForStaff)
  @IsOptional()
  @MaxLength(400, { message: 'Notes for prison staff must be $constraint1 characters or less' })
  notesForStaff: string
}

export default class CheckBookingHandler implements PageHandler {
  public PAGE_NAME = Page.CHECK_BOOKING_PAGE

  public BODY = Body

  constructor(
    private readonly courtBookingService: CourtBookingService,
    private readonly courtsService: CourtsService,
    private readonly prisonService: PrisonService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { mode } = req.params
    const { user } = res.locals
    const { bookACourtHearing } = req.session.journey
    const { prisoner, date, preHearingStartTime, startTime } = bookACourtHearing

    if (mode !== 'request') {
      const { availabilityOk } = await this.courtBookingService.checkAvailability(bookACourtHearing, user)

      if (!availabilityOk) {
        return res.redirect('not-available')
      }
    }

    const courts = await this.courtsService.getUserPreferences(user)

    const rooms = await this.prisonService.getAppointmentLocations(prisoner.prisonId, false, user)

    const hearingTypes = await this.referenceDataService.getCourtHearingTypes(user)

    const warnPrison =
      mode !== 'request' &&
      this.videoLinkService.prisonShouldBeWarnedOfBooking(parseISO(date), parseISO(preHearingStartTime || startTime))

    return res.render('pages/bookAVideoLink/court/checkBooking', {
      warnPrison,
      prisoner,
      courts,
      rooms,
      hearingTypes,
    })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { body } = req
    const { mode } = req.params

    req.session.journey.bookACourtHearing = {
      ...req.session.journey.bookACourtHearing,
      notesForStaff: body?.notesForStaff ? body.notesForStaff : req.session.journey.bookACourtHearing.notesForStaff,
    }

    if (mode !== 'request') {
      const { availabilityOk } = await this.courtBookingService.checkAvailability(
        req.session.journey.bookACourtHearing,
        user,
      )
      if (!availabilityOk) {
        return res.redirect('not-available')
      }
    }

    if (mode === 'create') {
      const id = await this.courtBookingService.createVideoLinkBooking(req.session.journey.bookACourtHearing, user)
      return res.redirect(`confirmation/${id}`)
    }

    if (mode === 'amend') {
      await this.courtBookingService.amendVideoLinkBooking(req.session.journey.bookACourtHearing, user)
    }

    if (mode === 'request') {
      await this.courtBookingService.requestVideoLinkBooking(req.session.journey.bookACourtHearing, user)
    }

    return res.redirect(`confirmation`)
  }
}
