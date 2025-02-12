// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { parse } from 'date-fns'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import IsValidDate from '../../../../validators/isValidDate'
import ProbationBookingService from '../../../../../services/probationBookingService'

const transformTime = (value: string) => (value ? parse(value, 'HH:mm', new Date(0)) : undefined)

class Body {
  @Expose()
  @Transform(({ value }) => transformTime(value))
  @IsValidDate({ message: 'A valid start time must be present' })
  @IsNotEmpty({ message: 'A start time must be present' })
  startTime: Date

  @Expose()
  @Transform(({ value }) => transformTime(value))
  @IsValidDate({ message: 'A valid end time must be present' })
  @IsNotEmpty({ message: 'A end time must be present' })
  endTime: Date
}

export default class BookingNotAvailableHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_NOT_AVAILABLE_PAGE

  public BODY = Body

  constructor(private readonly probationBookingService: ProbationBookingService) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { bookAVideoLink } = req.session.journey

    const { availabilityOk, alternatives } = await this.probationBookingService.checkAvailability(bookAVideoLink, user)

    if (availabilityOk) {
      return res.redirect('check-booking')
    }

    return res.render('pages/bookAVideoLink/probation/notAvailable', { alternatives })
  }

  public POST = async (req: Request, res: Response) => {
    const { startTime, endTime } = req.body

    req.session.journey.bookAVideoLink = {
      ...req.session.journey.bookAVideoLink,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    }

    res.redirect('check-booking')
  }
}
