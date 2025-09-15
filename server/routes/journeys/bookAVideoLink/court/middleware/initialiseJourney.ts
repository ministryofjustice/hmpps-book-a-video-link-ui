import { RequestHandler } from 'express'
import { parse } from 'date-fns'
import { isNotEmpty } from 'class-validator'
import { Services } from '../../../../../services'
import asyncMiddleware from '../../../../../middleware/asyncMiddleware'
import { extractPrisonAppointmentsFromBooking } from '../../../../../utils/utils'

export default ({ videoLinkService, prisonerService }: Services): RequestHandler => {
  return asyncMiddleware(async (req, res, next) => {
    const { bookingId } = req.params
    const { user } = res.locals

    if (bookingId === req.session.journey.bookACourtHearing?.bookingId?.toString()) return next()

    const booking = await videoLinkService.getVideoLinkBookingById(Number(bookingId), user)

    const parseTimeToISOString = (time: string) => (time ? parse(time, 'HH:mm', new Date(0)).toISOString() : undefined)
    const parseDateToISOString = (date: string) =>
      date ? parse(date, 'yyyy-MM-dd', new Date()).toISOString() : undefined

    const guestPinRequired = () => isNotEmpty(booking.guestPin)
    const getGuestPinValue = () => booking.guestPin || undefined
    const cvpLinkRequired = () => isNotEmpty(booking.hmctsNumber) || isNotEmpty(booking.videoLinkUrl)
    const getHmctsNumberValue = () => booking.hmctsNumber || undefined

    const { preAppointment, mainAppointment, postAppointment } = extractPrisonAppointmentsFromBooking(booking)

    const prisoner = await prisonerService.getPrisonerByPrisonerNumber(mainAppointment?.prisonerNumber, user)

    req.session.journey.bookACourtHearing = {
      bookingId: Number(bookingId),
      preHearingAppointmentId: preAppointment?.prisonAppointmentId,
      mainHearingAppointmentId: mainAppointment.prisonAppointmentId,
      postHearingAppointmentId: postAppointment?.prisonAppointmentId,
      bookingStatus: booking.statusCode,
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        prisonerNumber: prisoner.prisonerNumber,
        dateOfBirth: prisoner.dateOfBirth,
        prisonId: prisoner.prisonId,
        prisonName: prisoner.prisonName,
      },
      courtCode: booking.courtCode,
      hearingTypeCode: booking.courtHearingType,
      date: parseDateToISOString(mainAppointment.appointmentDate),
      startTime: parseTimeToISOString(mainAppointment.startTime),
      endTime: parseTimeToISOString(mainAppointment.endTime),
      preHearingStartTime: parseTimeToISOString(preAppointment?.startTime),
      preHearingEndTime: parseTimeToISOString(preAppointment?.endTime),
      postHearingStartTime: parseTimeToISOString(postAppointment?.startTime),
      postHearingEndTime: parseTimeToISOString(postAppointment?.endTime),
      locationCode: mainAppointment?.prisonLocKey,
      preLocationCode: preAppointment?.prisonLocKey,
      postLocationCode: postAppointment?.prisonLocKey,
      notesForStaff: booking.notesForStaff,
      cvpRequired: cvpLinkRequired(),
      hmctsNumber: getHmctsNumberValue(),
      guestPinRequired: guestPinRequired(),
      videoLinkUrl: booking.videoLinkUrl,
      guestPin: getGuestPinValue(),
    }

    return next()
  })
}
