import { Request, Response } from 'express'
import { format } from 'date-fns'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import VideoLinkService from '../../../../../services/videoLinkService'
import PrisonerService from '../../../../../services/prisonerService'

export default class BookingCancelledHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_CANCELLED_PAGE

  constructor(
    private readonly videoLinkService: VideoLinkService,
    private readonly prisonerService: PrisonerService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { bookingId } = req.params
    const { user } = res.locals

    const booking = await this.videoLinkService.getVideoLinkBookingById(+bookingId, user)

    const { prisonerNumber } = booking.prisonAppointments[0]
    const prisoner = await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    const originalBookingDate = req.session.journey.bookACourtHearing?.originalBookingDate
    const agencyCode = req.session.journey.bookACourtHearing?.courtCode

    req.session.journey.bookACourtHearing = null

    res.render('pages/bookAVideoLink/court/bookingCancelled', {
      prisoner,
      originalBookingDate: originalBookingDate ? format(new Date(originalBookingDate), 'dd-MM-yyyy') : undefined,
      agencyCode,
    })
  }
}
