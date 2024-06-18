import { NextFunction, Request, Response } from 'express'
import createError from 'http-errors'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import VideoLinkService from '../../../../services/videoLinkService'
import PrisonerService from '../../../../services/prisonerService'
import PrisonService from '../../../../services/prisonService'

export default class ViewBookingHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_BOOKING_PAGE

  constructor(
    private readonly videoLinkService: VideoLinkService,
    private readonly prisonerService: PrisonerService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.params
    const bookingId = Number(req.params.bookingId)
    const { user } = res.locals

    const booking = await this.videoLinkService.getVideoLinkBookingById(bookingId, user)

    if (type.toUpperCase() !== booking.bookingType) {
      return next(createError(404, 'Not found'))
    }

    // TODO: This currently assumes that there is only 1 prisoner associated with a booking.
    //  It does not cater for co-defendants at different prisons.
    const { prisonerNumber } = booking.prisonAppointments[0]
    const prisoner = await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)
    const rooms = await this.prisonService.getAppointmentLocations(prisoner.prisonId, user)

    return res.render('pages/viewBooking/viewBooking', {
      prisoner,
      booking,
      rooms,
    })
  }
}
