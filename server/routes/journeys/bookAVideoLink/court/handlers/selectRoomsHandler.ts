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

class Body {
  @Expose()
  @IsNotEmpty({ message: 'Select a prison room for the main court hearing' })
  location: string

  @Expose()
  @ValidateIf(({ journey }) => journey.bookACourtHearing.preHearingStartTime)
  @IsNotEmpty({ message: 'Select a prison room for the pre-court hearing' })
  preLocation: string

  @Expose()
  @ValidateIf(({ journey }) => journey.bookACourtHearing.postHearingStartTime)
  @IsNotEmpty({ message: 'Select a prison room for the post-court hearing' })
  postLocation: string
}

export default class SelectRoomsHandler implements PageHandler {
  public PAGE_NAME = Page.SELECT_ROOMS_PAGE

  public BODY = Body

  constructor(
    private readonly courtsService: CourtsService,
    private readonly courtBookingService: CourtBookingService,
    private readonly prisonerService: PrisonerService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals

    const journey = req.session.journey.bookACourtHearing

    const courts = await this.courtsService.getUserPreferences(user)

    const preRequired = journey.preHearingStartTime !== undefined
    const postRequired = journey.postHearingStartTime !== undefined

    const [preLocations, mainLocations, postLocations] = await Promise.all([
      preRequired
        ? this.courtBookingService.roomsAvailableByDateAndTime(
            journey,
            journey.preHearingStartTime,
            journey.preHearingEndTime,
            user,
          )
        : undefined,
      this.courtBookingService.roomsAvailableByDateAndTime(journey, journey.startTime, journey.endTime, user),
      postRequired
        ? this.courtBookingService.roomsAvailableByDateAndTime(
            journey,
            journey.postHearingStartTime,
            journey.postHearingEndTime,
            user,
          )
        : undefined,
    ])

    if (
      (preRequired && isEmpty(preLocations.locations)) ||
      (postRequired && isEmpty(postLocations.locations)) ||
      isEmpty(mainLocations.locations)
    ) {
      // One of the required lists is empty, so we cannot support the meeting at this time.
      res.redirect('not-available')
    } else {
      res.render('pages/bookAVideoLink/court/selectRooms', {
        courts,
        preLocations: preLocations?.locations,
        mainLocations: mainLocations.locations,
        postLocations: postLocations?.locations,
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
}
