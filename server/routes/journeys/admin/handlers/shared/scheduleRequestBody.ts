import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import _ from 'lodash'
import { isValid } from 'date-fns'
import Validator from '../../../../validators/validator'
import { simpleTimeToDate } from '../../../../../utils/utils'
import IsValidDate from '../../../../validators/isValidDate'

export default class ScheduleRequestBody {
  @Expose()
  @IsNotEmpty({ message: 'Select a schedule start day' })
  scheduleStartDay: string

  @Expose()
  @Validator((scheduleEndDay, { scheduleStartDay }) => +scheduleEndDay >= +scheduleStartDay, {
    message: 'Enter a schedule end day that is the same or after the schedule start day',
  })
  @IsNotEmpty({ message: 'Select a schedule end day' })
  scheduleEndDay: string

  @Expose()
  @IsNotEmpty({ message: 'Select a schedule permission' })
  schedulePermission: string

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  scheduleCourtCodes: string[]

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  scheduleProbationTeamCodes: string[]

  @Expose()
  @ValidateIf(o => !o.allDay)
  @Transform(({ value }) => simpleTimeToDate(value))
  @IsValidDate({ message: 'Enter a valid schedule start time' })
  @IsNotEmpty({ message: 'Enter a schedule start time' })
  scheduleStartTime: Date

  @Expose()
  @ValidateIf(o => !o.allDay)
  @Transform(({ value }) => simpleTimeToDate(value))
  @Validator(
    (scheduleEndTime, { scheduleStartTime }) =>
      isValid(scheduleStartTime) ? scheduleEndTime > scheduleStartTime : true,
    {
      message: 'Enter a schedule end time that is after the start time',
    },
  )
  @IsValidDate({ message: 'Enter a valid schedule end time' })
  @IsNotEmpty({ message: 'Enter a schedule end time' })
  scheduleEndTime: Date

  @Expose()
  @Transform(({ value }) => value === 'Yes')
  allDay: boolean
}
