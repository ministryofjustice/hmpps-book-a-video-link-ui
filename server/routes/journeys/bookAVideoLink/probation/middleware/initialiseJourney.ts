import { RequestHandler } from 'express'
import { differenceInMinutes, parse } from 'date-fns'
import { Services } from '../../../../../services'
import asyncMiddleware from '../../../../../middleware/asyncMiddleware'
import { extractPrisonAppointmentsFromBooking } from '../../../../../utils/utils'

export default ({ videoLinkService, prisonerService }: Services): RequestHandler => {
  return asyncMiddleware(async (req, res, next) => {
    const { bookingId } = req.params
    const { user } = res.locals

    if (bookingId === req.session.journey.bookAProbationMeeting?.bookingId?.toString()) return next()

    const booking = await videoLinkService.getVideoLinkBookingById(Number(bookingId), user)

    const parseDate = (date: string) => (date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined)
    const parseTime = (time: string) => (time ? parse(time, 'HH:mm', new Date(0)) : undefined)
    const parseTimeToISOString = (time: string) => (time ? parseTime(time).toISOString() : undefined)
    const parseDateToISOString = (date: string) => (date ? parseDate(date).toISOString() : undefined)

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
      officerDetailsNotKnown: booking.additionalBookingDetails?.contactName === undefined,
      officer: booking.additionalBookingDetails?.contactName
        ? {
            fullName: booking.additionalBookingDetails?.contactName,
            email: booking.additionalBookingDetails?.contactEmail,
            telephone: booking.additionalBookingDetails?.contactNumber,
          }
        : undefined,
      meetingTypeCode: booking.probationMeetingType,
      date: parseDateToISOString(mainAppointment.appointmentDate),
      duration: differenceInMinutes(parseTime(mainAppointment.endTime), parseTime(mainAppointment.startTime)),
      timePeriods: [mainAppointment.timeSlot],
      startTime: parseTimeToISOString(mainAppointment.startTime),
      endTime: parseTimeToISOString(mainAppointment.endTime),
      locationCode: mainAppointment?.prisonLocKey,
      comments: booking.comments,
    }

    return next()
  })
}
