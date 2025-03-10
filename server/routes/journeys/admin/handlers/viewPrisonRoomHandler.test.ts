import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'
import {
  Court,
  Prison,
  ProbationTeam,
  Location,
  RoomAttributes,
  RoomSchedule,
  CreateDecoratedRoomRequest,
  CreateRoomScheduleRequest,
  AmendDecoratedRoomRequest,
} from '../../../../@types/bookAVideoLinkApi/types'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import AdminService from '../../../../services/adminService'
import PrisonService from '../../../../services/prisonService'
import { radioOptions } from '../../../testutils/cheerio'
import config from '../../../../config'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/adminService')
jest.mock('../../../../services/courtsService')
jest.mock('../../../../services/probationTeamsService')

const adminService = new AdminService(null) as jest.Mocked<AdminService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>

const dpsLocationId = 'aaaa-bbbb-cccc-dddd'

let app: Express

beforeEach(() => {
  // Feature toggled
  config.featureToggles.adminLocationDecorationEnabled = true

  app = appWithAllRoutes({
    services: { prisonService, courtsService, probationTeamsService, adminService },
    userSupplier: () => user,
  })

  probationTeamsService.getUserPreferences.mockResolvedValue([
    { code: 'P1', description: 'Probation 1' },
    { code: 'P2', description: 'Probation 2' },
  ] as ProbationTeam[])

  courtsService.getUserPreferences.mockResolvedValue([
    { code: 'C1', description: 'Court 1' },
    { code: 'C2', description: 'Court 2' },
  ] as Court[])

  prisonService.getPrisonByCode.mockResolvedValue(aPrison())
  adminService.getLocationByDpsLocationId.mockResolvedValue(aDecoratedLocation())
  courtsService.getAllEnabledCourts.mockResolvedValue(aListOfCourts())
  probationTeamsService.getAllEnabledProbationTeams.mockResolvedValue(aListOfProbationTeams())
  adminService.createRoomAttributes.mockResolvedValue(aDecoratedLocation())
  adminService.amendRoomAttributes.mockResolvedValue(aDecoratedLocation())
  adminService.createRoomSchedule.mockResolvedValue(aSchedule())
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it(`should render an undecorated room with defaults`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(anUndecoratedLocation())

    return request(app)
      .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        const heading = $('h1').text().trim()
        const statusRadios = radioOptions($, 'roomStatus')
        const permissionRadios = radioOptions($, 'permission')
        const defaultStatus = $("input[type='radio'][name='roomStatus']:checked").val()
        const defaultPermission = $("input[type='radio'][name='permission']:checked").val()

        expect(heading).toBe(`Room One`)
        expect(statusRadios.length).toBe(2)
        expect(permissionRadios.length).toBe(4)
        expect(defaultStatus).toBe('active')
        expect(defaultPermission).toBe('shared')

        expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
        expect(courtsService.getAllEnabledCourts).toHaveBeenCalledWith(user)
        expect(probationTeamsService.getAllEnabledProbationTeams).toHaveBeenCalledWith(user)
        expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
      })
  })

  it(`should render a decorated room with a specific court permission`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aDecoratedLocation('COURT', ['C1']))

    return request(app)
      .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        const heading = $('h1').text().trim()
        const roomStatus = $("input[type='radio'][name='roomStatus']:checked").val()
        const roomPermission = $("input[type='radio'][name='permission']:checked").val()
        const specificCourts = $('[name="courtCodes"] option:selected').text()

        expect(heading).toBe(`Room One`)
        expect(roomStatus).toBe('active')
        expect(roomPermission).toBe('court')
        expect(specificCourts).toContain('Court 1')
      })
  })

  it(`should render a decorated room with a specific probation permission`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aDecoratedLocation('PROBATION', ['P1', 'P2']))

    return request(app)
      .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        const heading = $('h1').text().trim()
        const roomStatus = $("input[type='radio'][name='roomStatus']:checked").val()
        const roomPermission = $("input[type='radio'][name='permission']:checked").val()
        const specificTeams = $('[name="probationTeamCodes"] option:selected').text()

        expect(heading).toBe(`Room One`)
        expect(roomStatus).toBe('active')
        expect(roomPermission).toBe('probation')
        expect(specificTeams).toContain('Probation 1')
        expect(specificTeams).toContain('Probation 2')
      })
  })

  it(`should render a decorated room with an existing schedule`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule('COURT', []))

    return request(app)
      .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        const heading = $('h1').text().trim()
        const roomStatus = $("input[type='radio'][name='roomStatus']:checked").val()
        const roomPermission = $("input[type='radio'][name='permission']:checked").val()
        const existingSchedule = $("input[type='hidden'][name='existingSchedule']").val()
        const schedule: string[] = $('table > tbody > tr > td')
          .toArray()
          .map(i => $(i).text())

        expect(heading).toBe(`Room One`)
        expect(roomStatus).toBe('active')
        expect(roomPermission).toBe('schedule')
        expect(existingSchedule).toBe('true')
        expect(schedule[0]).toBe('Monday')
        expect(schedule[1]).toBe('Friday')
        expect(schedule[2]).toBe('08:00')
        expect(schedule[3]).toBe('18:00')
        expect(schedule[4]).toContain('Court')
        expect(schedule[5]).not.toContain('Court 1')
      })
  })

  it(`should render a decorated room with existing probation-specific schedule`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule('PROBATION', ['P1']))

    return request(app)
      .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        const heading = $('h1').text().trim()
        const roomStatus = $("input[type='radio'][name='roomStatus']:checked").val()
        const roomPermission = $("input[type='radio'][name='permission']:checked").val()
        const existingSchedule = $("input[type='hidden'][name='existingSchedule']").val()
        const schedule: string[] = $('table > tbody > tr > td')
          .toArray()
          .map(i => $(i).text())

        expect(heading).toBe(`Room One`)
        expect(roomStatus).toBe('active')
        expect(roomPermission).toBe('schedule')
        expect(existingSchedule).toBe('true')
        expect(schedule[0]).toBe('Monday')
        expect(schedule[1]).toBe('Friday')
        expect(schedule[2]).toBe('08:00')
        expect(schedule[3]).toBe('18:00')
        expect(schedule[4]).toContain('Probation')
        expect(schedule[5]).toContain('Probation 1')
        expect(schedule[6]).toContain('Edit')
        expect(schedule[6]).toContain('Delete')
      })
  })
})

describe('POST', () => {
  const aPostWithNoSchedule = {
    roomStatus: 'active',
    permission: 'shared',
    existingSchedule: 'false',
    videoUrl: 'link',
    notes: 'comments',
  }

  const aPostWithFirstSchedule = {
    roomStatus: 'active',
    permission: 'schedule',
    existingSchedule: 'false',
    videoUrl: 'link',
    notes: 'comments',
    allDay: 'Yes',
    schedulePermission: 'court',
    scheduleCourtCodes: ['C1'],
    scheduleStartDay: '1',
    scheduleEndDay: '7',
  }

  const aPostWithExistingSchedule = {
    roomStatus: 'active',
    permission: 'schedule',
    existingSchedule: 'true',
    videoUrl: 'link',
    notes: 'comments',
  }

  it(`should accept a minimal room POST and redirect`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(anUndecoratedLocation())

    return request(app)
      .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .send(aPostWithNoSchedule)
      .expect(302)
      .expect('location', `/admin/view-prison-room/HEI/${dpsLocationId}`)
      .expect(() => {
        expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
        expect(adminService.createRoomAttributes).toHaveBeenCalledWith(
          dpsLocationId,
          {
            locationStatus: 'ACTIVE',
            prisonVideoUrl: 'link',
            locationUsage: 'SHARED',
            comments: 'comments',
            allowedParties: [],
          } as CreateDecoratedRoomRequest,
          user,
        )
        expect(adminService.createRoomSchedule).not.toHaveBeenCalled()
      })
  })

  it(`should accept a room and first schedule POST and redirect`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aDecoratedLocation('SCHEDULE', []))

    return request(app)
      .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .send(aPostWithFirstSchedule)
      .expect(302)
      .expect('location', `/admin/view-prison-room/HEI/${dpsLocationId}`)
      .expect(() => {
        expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
        expect(adminService.amendRoomAttributes).toHaveBeenCalledWith(
          dpsLocationId,
          {
            locationStatus: 'ACTIVE',
            prisonVideoUrl: 'link',
            locationUsage: 'SCHEDULE',
            comments: 'comments',
            allowedParties: [],
          } as AmendDecoratedRoomRequest,
          user,
        )
        expect(adminService.createRoomSchedule).toHaveBeenCalledWith(
          dpsLocationId,
          {
            startDayOfWeek: 1,
            endDayOfWeek: 7,
            startTime: '07:00',
            endTime: '17:00',
            locationUsage: 'COURT',
            allowedParties: ['C1'],
          } as CreateRoomScheduleRequest,
          user,
        )
      })
  })

  it(`should accept a room with an existing schedule and redirect`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule('PROBATION', ['P1', 'P2']))

    return request(app)
      .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .send(aPostWithExistingSchedule)
      .expect(302)
      .expect('location', `/admin/view-prison-room/HEI/${dpsLocationId}`)
      .expect(() => {
        expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
        expect(adminService.amendRoomAttributes).toHaveBeenCalledWith(
          dpsLocationId,
          {
            locationStatus: 'ACTIVE',
            prisonVideoUrl: 'link',
            locationUsage: 'SCHEDULE',
            comments: 'comments',
            allowedParties: [],
          } as AmendDecoratedRoomRequest,
          user,
        )
      })
  })

  it(`should fail validation if no schedule permission is set`, () => {
    return request(app)
      .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .send({
        roomStatus: 'active',
        permission: 'schedule',
        existingSchedule: 'false',
        allDay: 'Yes',
        schedulePermission: null,
        scheduleStartDay: '1',
        scheduleEndDay: '7',
      })
      .expect(302)
      .expect('location', '/')
      .expect(() => {
        expectErrorMessages([
          {
            fieldId: 'schedulePermission',
            href: '#schedulePermission',
            text: 'Select a schedule permission',
          },
        ])
        expect(adminService.getLocationByDpsLocationId).not.toHaveBeenCalled()
      })
  })

  it(`should fail validation if schedule start day is after end day`, () => {
    return request(app)
      .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .send({
        roomStatus: 'active',
        permission: 'schedule',
        existingSchedule: 'false',
        allDay: 'Yes',
        schedulePermission: 'blocked',
        scheduleStartDay: '3',
        scheduleEndDay: '2',
      })
      .expect(302)
      .expect('location', '/')
      .expect(() => {
        expectErrorMessages([
          {
            fieldId: 'scheduleEndDay',
            href: '#scheduleEndDay',
            text: 'Enter a schedule end day that is the same or after the schedule start day',
          },
        ])
        expect(adminService.getLocationByDpsLocationId).not.toHaveBeenCalled()
      })
  })

  it(`should fail validation if schedule start time is after the end time`, () => {
    return request(app)
      .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .send({
        roomStatus: 'active',
        permission: 'schedule',
        existingSchedule: 'false',
        allDay: 'No',
        schedulePermission: 'blocked',
        scheduleStartDay: '1',
        scheduleEndDay: '3',
        scheduleStartTime: { hour: '11', minute: '00' },
        scheduleEndTime: { hour: '10', minute: '00' },
      })
      .expect(302)
      .expect('location', '/')
      .expect(() => {
        expectErrorMessages([
          {
            fieldId: 'scheduleEndTime',
            href: '#scheduleEndTime',
            text: 'Enter a schedule end time that is after the start time',
          },
        ])
        expect(adminService.getLocationByDpsLocationId).not.toHaveBeenCalled()
      })
  })

  it(`should fail validation if no schedule times are set`, () => {
    return request(app)
      .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
      .send({
        roomStatus: 'active',
        permission: 'schedule',
        existingSchedule: 'false',
        allDay: 'No',
        schedulePermission: 'blocked',
        scheduleStartDay: '1',
        scheduleEndDay: '7',
      })
      .expect(302)
      .expect('location', `/`)
      .expect(() => {
        expectErrorMessages([
          {
            fieldId: 'scheduleStartTime',
            href: '#scheduleStartTime',
            text: 'Enter a schedule start time',
          },
          {
            fieldId: 'scheduleEndTime',
            href: '#scheduleEndTime',
            text: 'Enter a schedule end time',
          },
        ])
        expect(adminService.getLocationByDpsLocationId).not.toHaveBeenCalled()
      })
  })
})

const aPrison = (): Prison => {
  return {
    prisonId: 1,
    code: 'HEI',
    name: 'Hewell (HMP)',
    enabled: true,
  } as Prison
}

const aListOfCourts = (): Court[] => {
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

const aListOfProbationTeams = (): ProbationTeam[] => {
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

const aLocationWithSchedule = (locationUsage: string = 'COURT', allowedParties: string[] = []): Location => {
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

const aDecoratedLocation = (locationUsage: string = 'SHARED', allowedParties: string[] = []): Location => {
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

const anUndecoratedLocation = (): Location => {
  return {
    key: 'KEY',
    prisonCode: 'HEI',
    description: 'Room One',
    dpsLocationId,
    enabled: true,
  } as Location
}

const aSchedule = (locationUsage: string = 'SHARED', allowedParties: string[] = []): RoomSchedule => {
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
