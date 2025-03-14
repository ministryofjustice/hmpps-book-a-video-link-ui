import { Request } from 'express'
import { addHours, format, parse, parseISO } from 'date-fns'
import {
  AmendDecoratedRoomRequest,
  AmendRoomScheduleRequest,
  CreateDecoratedRoomRequest,
  CreateRoomScheduleRequest,
  RoomSchedule,
} from '../../../../../@types/bookAVideoLinkApi/types'
import { dateToSimpleTime, getDaysOfWeek } from '../../../../../utils/utils'

export const START_OF_DAY_TIME = new Date('1970-01-01T07:00:00.000Z')
export const END_OF_DAY_TIME = new Date('1970-01-01T17:00:00.000Z')

export const bodyToCreateRoomRequest = (req: Request): CreateDecoratedRoomRequest => {
  const { roomStatus, videoUrl, permission, notes, courtCodes, probationTeamCodes } = req.body
  return {
    locationStatus: roomStatus === 'active' ? 'ACTIVE' : 'INACTIVE',
    prisonVideoUrl: videoUrl,
    locationUsage: permission.toUpperCase(),
    comments: notes,
    allowedParties: chooseAllowedParties(permission, courtCodes, probationTeamCodes),
  } as CreateDecoratedRoomRequest
}

export const bodyToAmendRoomRequest = (req: Request): AmendDecoratedRoomRequest => {
  const { roomStatus, videoUrl, permission, notes, courtCodes, probationTeamCodes } = req.body
  return {
    locationStatus: roomStatus === 'active' ? 'ACTIVE' : 'INACTIVE',
    prisonVideoUrl: videoUrl,
    locationUsage: permission.toUpperCase(),
    comments: notes,
    allowedParties: chooseAllowedParties(permission, courtCodes, probationTeamCodes),
  } as AmendDecoratedRoomRequest
}

export const bodyToCreateScheduleRequest = (req: Request): CreateRoomScheduleRequest => {
  const {
    scheduleStartDay,
    scheduleEndDay,
    allDay,
    scheduleStartTime,
    scheduleEndTime,
    schedulePermission,
    scheduleCourtCodes,
    scheduleProbationTeamCodes,
  } = req.body

  // Use fixed start and end times if the all-day checkbox is clicked, otherwise the selected times
  const startTime: string = allDay ? START_OF_DAY_TIME.toISOString() : scheduleStartTime.toISOString()
  const endTime: string = allDay ? END_OF_DAY_TIME.toISOString() : scheduleEndTime.toISOString()

  // Parse to a Date object
  const startTimeAsDate = parseISO(startTime)
  const endTimeAsDate = parseISO(endTime)

  return {
    startDayOfWeek: parseInt(scheduleStartDay, 10),
    endDayOfWeek: parseInt(scheduleEndDay, 10),
    startTime: format(startTimeAsDate, 'HH:mm'),
    endTime: format(endTimeAsDate, 'HH:mm'),
    locationUsage: schedulePermission.toUpperCase(),
    allowedParties: chooseAllowedParties(schedulePermission, scheduleCourtCodes, scheduleProbationTeamCodes),
  } as CreateRoomScheduleRequest
}

export const bodyToAmendScheduleRequest = (req: Request): AmendRoomScheduleRequest => {
  const {
    scheduleStartDay,
    scheduleEndDay,
    allDay,
    scheduleStartTime,
    scheduleEndTime,
    schedulePermission,
    scheduleCourtCodes,
    scheduleProbationTeamCodes,
  } = req.body

  // Use fixed start and end times if the all-day checkbox is clicked, otherwise the selected times
  const startTime: string = allDay ? START_OF_DAY_TIME.toISOString() : scheduleStartTime.toISOString()
  const endTime: string = allDay ? END_OF_DAY_TIME.toISOString() : scheduleEndTime.toISOString()

  // Parse to a Date object
  const startTimeAsDate = parseISO(startTime)
  const endTimeAsDate = parseISO(endTime)

  return {
    startDayOfWeek: parseInt(scheduleStartDay, 10),
    endDayOfWeek: parseInt(scheduleEndDay, 10),
    startTime: format(startTimeAsDate, 'HH:mm'),
    endTime: format(endTimeAsDate, 'HH:mm'),
    locationUsage: schedulePermission.toUpperCase(),
    allowedParties: chooseAllowedParties(schedulePermission, scheduleCourtCodes, scheduleProbationTeamCodes),
  } as AmendRoomScheduleRequest
}

export const convertScheduleToDisplayFormat = (schedule: RoomSchedule) => {
  const startTimeAsDate = parse(schedule.startTime, 'HH:mm', new Date())
  const endTimeAsDate = parse(schedule.endTime, 'HH:mm', new Date())

  return {
    scheduleStartDay: getDaysOfWeek().indexOf(schedule.startDayOfWeek) + 1,
    scheduleEndDay: getDaysOfWeek().indexOf(schedule.endDayOfWeek) + 1,
    scheduleCourtCodes: schedule.locationUsage.toUpperCase() === 'COURT' ? schedule.allowedParties : [],
    scheduleProbationTeams: schedule.locationUsage.toUpperCase() === 'PROBATION' ? schedule.allowedParties : [],
    schedulePermission: schedule.locationUsage.toLowerCase(),
    allDay:
      schedule.startTime === format(addHours(START_OF_DAY_TIME, 1), 'HH:mm') &&
      schedule.endTime === format(addHours(END_OF_DAY_TIME, 1), 'HH:mm')
        ? 'Yes'
        : 'No',
    scheduleStartTime: dateToSimpleTime(startTimeAsDate),
    scheduleEndTime: dateToSimpleTime(endTimeAsDate),
  } as unknown
}

export const chooseAllowedParties = (
  permission: string,
  courtCodes: string[],
  probationTeamCodes: string[],
): string[] => {
  switch (permission) {
    case 'court':
      return courtCodes
    case 'probation':
      return probationTeamCodes
    default:
      return []
  }
}
