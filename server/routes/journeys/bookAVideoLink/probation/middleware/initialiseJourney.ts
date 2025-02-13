import { RequestHandler } from 'express'
import { parse } from 'date-fns'
import { Services } from '../../../../../services'
import asyncMiddleware from '../../../../../middleware/asyncMiddleware'
import { extractPrisonAppointmentsFromBooking } from '../../../../../utils/utils'

export default ({ videoLinkService, prisonerService }: Services): RequestHandler => {
  return asyncMiddleware(async (req, res, next) => {
    const { bookingId } = req.params
    const { user } = res.locals

    if (bookingId === req.session.journey.bookAProbationMeeting?.bookingId?.toString()) return next()

    const booking = await videoLinkService.getVideoLinkBookingById(Number(bookingId), user)

    const parseTimeToISOString = (time: string) => (time ? parse(time, 'HH:mm', new Date(0)).toISOString() : undefined)
    const parseDateToISOString = (date: string) =>
      date ? parse(date, 'yyyy-MM-dd', new Date()).toISOString() : undefined

    const { mainAppointment } = extractPrisonAppointmentsFromBooking(booking)

    const prisoner = await prisonerService.getPrisonerByPrisonerNumber(mainAppointment?.prisonerNumber, user)

    req.session.journey.bookAProbationMeeting = {
      bookingId: Number(bookingId),
      bookingStatus: booking.statusCode,
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        prisonerNumber: prisoner.prisonerNumber,
        dateOfBirth: prisoner.dateOfBirth,
        prisonId: prisoner.prisonId,
        prisonName: prisoner.prisonName,
      },
      probationTeamCode: booking.probationTeamCode,
      meetingTypeCode: booking.probationMeetingType,
      date: parseDateToISOString(mainAppointment.appointmentDate),
      startTime: parseTimeToISOString(mainAppointment.startTime),
      endTime: parseTimeToISOString(mainAppointment.endTime),
      locationCode: mainAppointment?.prisonLocKey,
      comments: booking.comments,
      videoLinkUrl: booking.videoLinkUrl,
    }

    return next()
  })
}
