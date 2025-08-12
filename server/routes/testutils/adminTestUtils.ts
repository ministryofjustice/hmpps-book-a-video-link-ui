import {
  Court,
  Location,
  Prison,
  ProbationTeam,
  RoomAttributes,
  RoomSchedule,
} from '../../@types/bookAVideoLinkApi/types'

export const userPreferencesProbation = () => {
  return [
    { code: 'P1', description: 'Probation 1' },
    { code: 'P2', description: 'Probation 2' },
  ] as ProbationTeam[]
}

export const userPreferencesCourt = () => {
  return [
    { code: 'C1', description: 'Court 1' },
    { code: 'C2', description: 'Court 2' },
  ] as Court[]
}

export const aPrison = (prisonId: number = 1, code: string = 'HEI', name: string = 'Hewell (HMP)'): Prison => {
  return {
    prisonId,
    code,
    name,
    enabled: true,
  } as Prison
}

export const aListOfCourts = (): Court[] => {
  return [
    {
      courtId: 1,
      code: 'C1',
      description: 'Court 1',
    } as Court,
    {
      courtId: 2,
      code: 'C2',
      description: 'Court 2',
    } as Court,
  ]
}

export const aListOfProbationTeams = (): ProbationTeam[] => {
  return [
    {
      probationTeamId: 1,
      code: 'P1',
      description: 'Probation 1',
    } as ProbationTeam,
    {
      probationTeamId: 2,
      code: 'P2',
      description: 'Probation 2',
    } as ProbationTeam,
  ]
}

export const aLocationWithSchedule = (
  dpsLocationId: string,
  locationUsage: string = 'COURT',
  allowedParties: string[] = [],
): Location => {
  return {
    key: 'KEY',
    prisonCode: 'HEI',
    description: 'Room One',
    dpsLocationId,
    enabled: true,
    extraAttributes: {
      attributeId: 1,
      locationStatus: 'ACTIVE',
      locationUsage: 'SCHEDULE',
      prisonVideoUrl: 'link',
      notes: 'Comments',
      allowedParties: [],
      schedule: [
        {
          scheduleId: 1,
          startDayOfWeek: 'MONDAY',
          endDayOfWeek: 'FRIDAY',
          startTime: '08:00',
          endTime: '18:00',
          locationUsage,
          allowedParties,
        } as RoomSchedule,
      ],
    } as RoomAttributes,
  } as Location
}

export const aSchedule = (locationUsage: string = 'SHARED', allowedParties: string[] = []): RoomSchedule => {
  return {
    scheduleId: 1,
    startDayOfWeek: 'MONDAY',
    endDayOfWeek: 'FRIDAY',
    startTime: '08:00',
    endTime: '18:00',
    locationUsage,
    allowedParties,
  } as RoomSchedule
}

export const aDecoratedLocation = (
  dpsLocationId: string,
  locationUsage: string = 'SHARED',
  allowedParties: string[] = [],
): Location => {
  return {
    key: 'KEY',
    prisonCode: 'HEI',
    description: 'Room One',
    dpsLocationId,
    enabled: true,
    extraAttributes: {
      attributeId: 1,
      locationStatus: 'ACTIVE',
      locationUsage,
      prisonVideoUrl: 'link',
      notes: 'comments',
      allowedParties,
    } as RoomAttributes,
  } as Location
}

export const anUndecoratedLocation = (dpsLocationId: string): Location => {
  return {
    key: 'KEY',
    prisonCode: 'HEI',
    description: 'Room One',
    dpsLocationId,
    enabled: true,
  } as Location
}
