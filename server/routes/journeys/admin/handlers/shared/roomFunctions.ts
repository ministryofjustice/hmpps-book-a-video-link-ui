import { Request } from 'express'
import { addHours, format, formatDate, parse, parseISO } from 'date-fns'
import { dateToSimpleTime, getDaysOfWeek } from '../../../../../utils/utils'
import {
  AmendDecoratedRoomRequest,
  AmendRoomScheduleRequest,
  CreateDecoratedRoomRequest,
  CreateRoomScheduleRequest,
  RoomSchedule,
} from '../../../../../@types/bookAVideoLinkApi/types'
import config from '../../../../../config'

export const START_OF_DAY_TIME = new Date('1970-01-01T07:00:00.000Z')
export const END_OF_DAY_TIME = new Date('1970-01-01T17:00:00.000Z')

export const bodyToCreateRoomRequest = (req: Request): CreateDecoratedRoomRequest => {
  const { videoUrl, permission, notes, courtCodes, probationTeamCodes } = req.body
  const details = locationStatusDetails(req)

  return {
    locationStatus: details.locationStatus,
    prisonVideoUrl: videoUrl,
    locationUsage: permission.toUpperCase(),
    comments: notes,
    allowedParties: chooseAllowedParties(permission, courtCodes, probationTeamCodes),
    blockedFrom: details.blockedFrom,
    blockedTo: details.blockedTo,
  } as CreateDecoratedRoomRequest
}

export const bodyToAmendRoomRequest = (req: Request): AmendDecoratedRoomRequest => {
  const { videoUrl, permission, notes, courtCodes, probationTeamCodes } = req.body
  const details = locationStatusDetails(req)

  return {
    locationStatus: details.locationStatus,
    prisonVideoUrl: videoUrl,
    locationUsage: permission.toUpperCase(),
    comments: notes,
    allowedParties: chooseAllowedParties(permission, courtCodes, probationTeamCodes),
    blockedFrom: details.blockedFrom,
    blockedTo: details.blockedTo,
  } as AmendDecoratedRoomRequest
}

export const locationStatusDetails = (req: Request) => {
  const { roomStatus, blockedFrom, blockedTo } = req.body

  let locationStatus = null

  if (config.featureToggles.temporaryBlockingLocations) {
    switch (roomStatus) {
      case 'active':
        locationStatus = 'ACTIVE'
        break
      case 'inactive':
        locationStatus = 'INACTIVE'
        break
      case 'temporarily_blocked':
        locationStatus = 'TEMPORARILY_BLOCKED'
        break
      default:
        locationStatus = 'ACTIVE'
    }
  } else {
    locationStatus = roomStatus === 'active' ? 'ACTIVE' : 'INACTIVE'
  }

  return {
    locationStatus,
    blockedFrom:
      config.featureToggles.temporaryBlockingLocations && blockedFrom && locationStatus === 'TEMPORARILY_BLOCKED'
        ? formatDate(blockedFrom, 'yyyy-MM-dd')
        : null,
    blockedTo:
      config.featureToggles.temporaryBlockingLocations && blockedTo && locationStatus === 'TEMPORARILY_BLOCKED'
        ? formatDate(blockedTo, 'yyyy-MM-dd')
        : null,
  }
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
