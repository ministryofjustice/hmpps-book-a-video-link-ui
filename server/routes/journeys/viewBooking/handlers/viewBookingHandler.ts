import { Request, Response } from 'express'
import { parse, parseISO } from 'date-fns'
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

  GET = async (req: Request, res: Response) => {
    const { bookingId } = req.params
    const { user } = res.locals

    const booking = await this.videoLinkService.getVideoLinkBookingById(+bookingId, user)

    // TODO: This currently assumes that there is only 1 prisoner associated with a booking.
    //  It does not cater for co-defendants at different prisons.
    const { prisonerNumber } = booking.prisonAppointments[0]
    const prisoner = await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)
    const rooms = await this.prisonService.getAppointmentLocations(prisoner.prisonId, false, user)

    const earliestAppointment = booking.prisonAppointments.sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
    const date = parseISO(earliestAppointment.appointmentDate)
    const time = parse(earliestAppointment.startTime, 'HH:mm', new Date(0))
    const isAmendable = this.videoLinkService.bookingIsAmendable(date, time, booking.statusCode)

    return res.render('pages/viewBooking/viewBooking', {
      prisoner,
      booking,
      rooms,
      isAmendable,
      isCancelled: booking.statusCode === 'CANCELLED',
    })
  }
}
