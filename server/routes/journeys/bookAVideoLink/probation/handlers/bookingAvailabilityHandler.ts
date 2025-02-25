// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { parse } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ProbationBookingService from '../../../../../services/probationBookingService'

class Body {
  @Expose()
  @IsNotEmpty({ message: `Select a suitable booking` })
  option: string

  @Expose()
  @Transform(({ obj }) => obj.option && parse(obj.option.split('///')[0], 'HH:mm', new Date(0), { locale: enGB }))
  startTime: string

  @Expose()
  @Transform(({ obj }) => obj.option && parse(obj.option.split('///')[1], 'HH:mm', new Date(0), { locale: enGB }))
  endTime: string

  @Expose()
  @Transform(({ obj }) => obj.option && obj.option.split('///')[2])
  dpsLocationKey: string
}

export default class BookingAvailabilityHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_AVAILABILITY_PAGE

  public BODY = Body

  constructor(private readonly probationBookingService: ProbationBookingService) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { bookAProbationMeeting } = req.session.journey

    const { locations } = await this.probationBookingService.getAvailableLocations(bookAProbationMeeting, user)

    return res.render('pages/bookAVideoLink/probation/availability', {
      requestedSlots: locations.filter(l => bookAProbationMeeting.timePeriods.includes(l.timeSlot)),
      otherSlots: locations.filter(l => !bookAProbationMeeting.timePeriods.includes(l.timeSlot)),
    })
  }

  public POST = async (req: Request, res: Response) => {
    const { startTime, endTime, dpsLocationKey } = req.body

    req.session.journey.bookAProbationMeeting = {
      ...req.session.journey.bookAProbationMeeting,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      locationCode: dpsLocationKey,
    }

    return res.redirect('check-booking')
  }
}
