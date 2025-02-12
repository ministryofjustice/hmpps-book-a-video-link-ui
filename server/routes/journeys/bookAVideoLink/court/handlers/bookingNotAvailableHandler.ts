// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import { parse } from 'date-fns'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import IsValidDate from '../../../../validators/isValidDate'
import CourtBookingService from '../../../../../services/courtBookingService'

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

  @Expose()
  @Transform(({ value }) => transformTime(value))
  @ValidateIf(o => o.journey.bookAVideoLink.preLocationCode)
  @IsValidDate({ message: 'A valid pre-court start time must be present' })
  @IsNotEmpty({ message: 'A pre-court start time must be present' })
  preStart: Date

  @Expose()
  @Transform(({ value }) => transformTime(value))
  @ValidateIf(o => o.journey.bookAVideoLink.preLocationCode)
  @IsValidDate({ message: 'A valid pre-court end time must be present' })
  @IsNotEmpty({ message: 'A pre-court end time must be present' })
  preEnd: Date

  @Expose()
  @Transform(({ value }) => transformTime(value))
  @ValidateIf(o => o.journey.bookAVideoLink.postLocationCode)
  @IsValidDate({ message: 'A valid post-court start time must be present' })
  @IsNotEmpty({ message: 'A post-court start time must be present' })
  postStart: Date

  @Expose()
  @Transform(({ value }) => transformTime(value))
  @ValidateIf(o => o.journey.bookAVideoLink.postLocationCode)
  @IsValidDate({ message: 'A valid post-court end time must be present' })
  @IsNotEmpty({ message: 'A post-court end time must be present' })
  postEnd: Date
}

export default class BookingNotAvailableHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_NOT_AVAILABLE_PAGE

  public BODY = Body

  constructor(private readonly courtBookingService: CourtBookingService) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { bookAVideoLink } = req.session.journey

    const { availabilityOk, alternatives } = await this.courtBookingService.checkAvailability(bookAVideoLink, user)

    if (availabilityOk) {
      return res.redirect('check-booking')
    }

    return res.render('pages/bookAVideoLink/court/notAvailable', { alternatives })
  }

  public POST = async (req: Request, res: Response) => {
    const { startTime, endTime, preStart, preEnd, postStart, postEnd } = req.body

    req.session.journey.bookAVideoLink = {
      ...req.session.journey.bookAVideoLink,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      preHearingStartTime: preStart?.toISOString(),
      preHearingEndTime: preEnd?.toISOString(),
      postHearingStartTime: postStart?.toISOString(),
      postHearingEndTime: postEnd?.toISOString(),
    }

    res.redirect('check-booking')
  }
}
