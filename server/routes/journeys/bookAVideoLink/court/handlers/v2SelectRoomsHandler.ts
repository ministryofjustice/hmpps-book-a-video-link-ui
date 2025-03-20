// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import { isEmpty } from 'lodash'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CourtsService from '../../../../../services/courtsService'
import PrisonerService from '../../../../../services/prisonerService'
import CourtBookingService from '../../../../../services/courtBookingService'
import { formatDate } from '../../../../../utils/utils'

class Body {
  @Expose()
  @IsNotEmpty({ message: 'Select a prison room for the main court hearing' })
  location: string

  @Expose()
  preRequired: string

  @Expose()
  @ValidateIf(o => o.preRequired === 'true')
  @IsNotEmpty({ message: 'Select a prison room for the pre-court hearing' })
  preLocation: string

  @Expose()
  postRequired: string

  @Expose()
  @ValidateIf(o => o.postRequired === 'true')
  @IsNotEmpty({ message: 'Select a prison room for the post-court hearing' })
  postLocation: string
}

export default class V2SelectRoomsHandler implements PageHandler {
  public PAGE_NAME = Page.SELECT_ROOMS_PAGE

  public BODY = Body

  constructor(
    private readonly courtsService: CourtsService,
    private readonly courtBookingService: CourtBookingService,
    private readonly prisonerService: PrisonerService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { mode } = req.params

    const journey = req.session.journey.bookACourtHearing

    const offender = journey?.prisoner
    const prisonerNumber = req.params.prisonerNumber || offender.prisonerNumber
    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)
    const courts = await this.courtsService.getUserPreferences(user)

    const preReq = journey?.preHearingStartTime !== undefined
    const postReq = journey?.postHearingStartTime !== undefined

    const [preLocations, mainLocations, postLocations] = await Promise.all([
      preReq
        ? this.courtBookingService.roomsAvailableByDateAndTime(
            journey,
            journey.preHearingStartTime,
            journey.preHearingEndTime,
            user,
          )
        : Promise.resolve(null),
      this.courtBookingService.roomsAvailableByDateAndTime(journey, journey.startTime, journey.endTime, user),
      postReq
        ? this.courtBookingService.roomsAvailableByDateAndTime(
            journey,
            journey.postHearingStartTime,
            journey.postHearingEndTime,
            user,
          )
        : Promise.resolve(null),
    ])

    /**
    logger.info(`PRE rooms ${JSON.stringify(preLocations, null, 2)}`)
    logger.info(`MAIN rooms ${JSON.stringify(mainLocations, null, 2)}`)
    logger.info(`POST rooms ${JSON.stringify(postLocations, null, 2)}`)
    */

    if (
      (preReq && isEmpty(preLocations.locations)) ||
      (postReq && isEmpty(postLocations.locations)) ||
      isEmpty(mainLocations.locations)
    ) {
      // One of the required lists is empty so we cannot support the meeting at this time.
      res.redirect('no-rooms')
    } else {
      // At least one room is available for each of the hearings - offer the choice
      const preTimes = preReq ? this.formatTimes(journey.preHearingStartTime, journey.preHearingEndTime) : undefined
      const mainTimes = this.formatTimes(journey.startTime, journey.endTime)
      const postTimes = postReq ? this.formatTimes(journey.postHearingStartTime, journey.postHearingEndTime) : undefined

      res.render('pages/bookAVideoLink/court/v2SelectRooms', {
        prisoner: {
          firstName: prisoner.firstName,
          lastName: prisoner.lastName,
          dateOfBirth: prisoner.dateOfBirth,
          prisonerNumber: prisoner.prisonerNumber,
          prisonName: prisoner.prisonName,
        },
        courts,
        preLocations: preLocations?.locations,
        mainLocations: mainLocations.locations,
        postLocations: postLocations?.locations,
        preTimes,
        mainTimes,
        postTimes,
        fromReview: req.get('Referrer')?.endsWith('check-booking'),
      })
    }
  }

  public POST = async (req: Request, res: Response) => {
    const { preLocation, location, postLocation } = req.body

    req.session.journey.bookACourtHearing = {
      ...req.session.journey.bookACourtHearing,
      locationCode: location,
      preLocationCode: preLocation,
      postLocationCode: postLocation,
    }
    return res.redirect('check-booking')
  }

  // Shared utils.
  private formatTimes = (startTime: string, endTime: string): string => {
    return `${formatDate(startTime, 'HH:mm')} to ${formatDate(endTime, 'HH:mm')}`
  }
}
