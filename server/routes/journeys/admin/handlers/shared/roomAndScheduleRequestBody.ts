import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty, MaxLength, ValidateIf } from 'class-validator'
import _ from 'lodash'
import { isBefore, isValid, startOfToday } from 'date-fns'
import Validator from '../../../../validators/validator'
import { parseDatePickerDate, simpleTimeToDate } from '../../../../../utils/utils'
import IsValidDate from '../../../../validators/isValidDate'
import config from '../../../../../config'

export default class RoomAndScheduleRequestBody {
  @Expose()
  @IsNotEmpty({ message: 'Select a room status' })
  roomStatus: string

  @Expose()
  @ValidateIf(
    o => config.featureToggles.temporaryBlockingLocations && o.roomStatus && o.roomStatus === 'temporarily_blocked',
  )
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator((blockedFrom, { blockedTo }) => isValid(blockedTo) && !isBefore(blockedTo, blockedFrom), {
    message: 'Enter a date from on or before the date to',
  })
  @IsValidDate({ message: 'Enter a valid date the room block will start' })
  @IsNotEmpty({ message: 'Enter the date the room block will start' })
  blockedFrom: Date

  @Expose()
  @ValidateIf(
    o => config.featureToggles.temporaryBlockingLocations && o.roomStatus && o.roomStatus === 'temporarily_blocked',
  )
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator((blockedTo, { blockedFrom }) => isValid(blockedFrom) && !isBefore(blockedTo, blockedFrom), {
    message: 'Enter a date to on or after the date from',
  })
  @Validator(date => date >= startOfToday(), {
    message: "Enter a date to on or after today's date",
  })
  @IsValidDate({ message: 'Enter a valid date the room block will end' })
  @IsNotEmpty({ message: 'Enter the date the room block will end' })
  blockedTo: Date

  @Expose()
  @ValidateIf(o => o.videoUrl)
  @MaxLength(300, { message: 'The room link must be less than 300 characters' })
  videoUrl: string

  @Expose()
  @IsNotEmpty({ message: 'Select a room permission' })
  permission: string

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  courtCodes: string[]

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  probationTeamCodes: string[]

  @Expose()
  existingSchedule: string

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @IsNotEmpty({ message: 'Select a schedule start day' })
  scheduleStartDay: string

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @Validator((scheduleEndDay, { scheduleStartDay }) => +scheduleEndDay >= +scheduleStartDay, {
    message: 'Enter a schedule end day that is the same or after the schedule start day',
  })
  @IsNotEmpty({ message: 'Select a schedule end day' })
  scheduleEndDay: string

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @IsNotEmpty({ message: 'Select a schedule permission' })
  schedulePermission: string

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  scheduleCourtCodes: string[]

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  scheduleProbationTeamCodes: string[]

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule' && !o.allDay)
  @Transform(({ value }) => simpleTimeToDate(value))
  @IsValidDate({ message: 'Enter a valid schedule start time' })
  @IsNotEmpty({ message: 'Enter a schedule start time' })
  scheduleStartTime: Date

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule' && !o.allDay)
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

  @Expose()
  @ValidateIf(o => o.notes)
  @MaxLength(400, { message: 'The comments must be at most 400 characters' })
  notes: string
}
