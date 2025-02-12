import { Request, Response } from 'express'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import VideoLinkService from '../../../../../services/videoLinkService'
import PrisonerService from '../../../../../services/prisonerService'
import PrisonService from '../../../../../services/prisonService'

export default class ConfirmationHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_CONFIRMATION_PAGE

  constructor(
    private readonly videoLinkService: VideoLinkService,
    private readonly prisonerService: PrisonerService,
    private readonly prisonService: PrisonService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const bookingId = Number(req.params.bookingId)
    const { user } = res.locals

    const booking = await this.videoLinkService.getVideoLinkBookingById(bookingId, user)

    // TODO: This currently assumes that there is only 1 prisoner associated with a booking.
    //  It does not cater for co-defendants at different prisons.
    const { prisonerNumber, prisonCode } = booking.prisonAppointments[0]
    const [prisoner, prison, rooms] = await Promise.all([
      this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user),
      this.prisonService.getPrisonByCode(prisonCode, user),
      this.prisonService.getAppointmentLocations(prisonCode, false, user),
    ])

    req.session.journey.bookACourtHearing = null

    res.render('pages/bookAVideoLink/court/confirmation', {
      prisoner,
      prison,
      booking,
      rooms,
    })
  }
}
