import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator'
import { startOfToday } from 'date-fns'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import VideoLinkService from '../../../../services/videoLinkService'
import logger from '../../../../../logger'
import { parseDatePickerDate } from '../../../../utils/utils'
import Validator from '../../../validators/validator'
import IsValidDate from '../../../validators/isValidDate'

class Body {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date <= startOfToday(), { message: "Enter a date which is before or on today's date" })
  @IsValidDate({ message: 'Enter a valid start date' })
  @IsNotEmpty({ message: 'Enter a start date' })
  startDate: Date

  @Expose()
  @Transform(({ value }) => +value)
  @IsInt({ message: 'Enter a whole number between 1 and 365' })
  @Min(1)
  @Max(365)
  @IsNotEmpty({ message: 'Enter a number of days from the start date to extract data for' })
  numberOfDays: number
}

export default class ExtractByBookingDateHandler implements PageHandler {
  public PAGE_NAME = Page.EXTRACT_BY_BOOKING_PAGE
  public BODY = Body

  constructor(private readonly videoLinkService: VideoLinkService) {}

  GET = async (req: Request, res: Response) => res.render('pages/admin/extractByBookingDate')

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { startDate, numberOfDays } = req.body
    logger.info(`StartDate ${startDate}, days ${numberOfDays}`)
    return this.videoLinkService.downloadBookingDataByBookingDate(startDate, numberOfDays, res, user)
  }
}
