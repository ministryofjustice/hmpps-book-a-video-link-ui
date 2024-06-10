import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import VideoLinkService from '../../../../services/videoLinkService'
import PrisonerService from '../../../../services/prisonerService'
import PrisonService from '../../../../services/prisonService'

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

    const { prisonerNumber } = booking.prisonAppointments[0]
    const prisoner = await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)
    const rooms = await this.prisonService.getAppointmentLocations(prisoner.prisonId, user)

    res.render('pages/bookAVideoLink/confirmation', {
      prisoner,
      booking,
      rooms,
    })
  }
}
