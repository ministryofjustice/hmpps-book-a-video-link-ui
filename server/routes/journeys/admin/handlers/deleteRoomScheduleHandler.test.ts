import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import {
  Court,
  Prison,
  ProbationTeam,
  Location,
  RoomAttributes,
  RoomSchedule,
} from '../../../../@types/bookAVideoLinkApi/types'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import AdminService from '../../../../services/adminService'
import PrisonService from '../../../../services/prisonService'
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
  courtsService.getAllEnabledCourts.mockResolvedValue(aListOfCourts())
  probationTeamsService.getAllEnabledProbationTeams.mockResolvedValue(aListOfProbationTeams())
  adminService.createRoomSchedule.mockResolvedValue(aSchedule())
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it(`should render a room with a blocked schedule to delete`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule('BLOCKED', []))
    const { scheduleId } = aLocationWithSchedule().extraAttributes.schedule[0]

    return request(app)
      .get(`/admin/delete-schedule/HEI/${dpsLocationId}/${scheduleId}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        const heading = $('h1').text().trim()
        const schedule: string[] = $('table > tbody > tr > td')
          .toArray()
          .map(i => $(i).text())

        expect(heading).toBe(`Are you sure you want to delete this schedule for Room One`)

        expect(schedule[0]).toBe('Monday')
        expect(schedule[1]).toBe('Friday')
        expect(schedule[2]).toBe('08:00')
        expect(schedule[3]).toBe('18:00')
        expect(schedule[4]).toContain('Blocked')
        expect(schedule[5]).toContain('')

        expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
        expect(courtsService.getAllEnabledCourts).toHaveBeenCalledWith(user)
        expect(probationTeamsService.getAllEnabledProbationTeams).toHaveBeenCalledWith(user)
        expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
      })
  })

  it(`should render a court room schedule with specific courts to delete`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule('COURT', ['C1', 'C2']))
    const { scheduleId } = aLocationWithSchedule().extraAttributes.schedule[0]

    return request(app)
      .get(`/admin/delete-schedule/HEI/${dpsLocationId}/${scheduleId}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        const heading = $('h1').text().trim()
        const schedule: string[] = $('table > tbody > tr > td')
          .toArray()
          .map(i => $(i).text())

        expect(heading).toBe(`Are you sure you want to delete this schedule for Room One`)

        expect(schedule[0]).toBe('Monday')
        expect(schedule[1]).toBe('Friday')
        expect(schedule[2]).toBe('08:00')
        expect(schedule[3]).toBe('18:00')
        expect(schedule[4]).toContain('Court')
        expect(schedule[5]).toContain('Court 1')
        expect(schedule[5]).toContain('Court 2')

        expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
        expect(courtsService.getAllEnabledCourts).toHaveBeenCalledWith(user)
        expect(probationTeamsService.getAllEnabledProbationTeams).toHaveBeenCalledWith(user)
        expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
      })
  })

  it(`should render a probation room schedule with specific teams to delete`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule('PROBATION', ['P1', 'P2']))
    const { scheduleId } = aLocationWithSchedule().extraAttributes.schedule[0]

    return request(app)
      .get(`/admin/delete-schedule/HEI/${dpsLocationId}/${scheduleId}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        const heading = $('h1').text().trim()
        const schedule: string[] = $('table > tbody > tr > td')
          .toArray()
          .map(i => $(i).text())

        expect(heading).toBe(`Are you sure you want to delete this schedule for Room One`)

        expect(schedule[0]).toBe('Monday')
        expect(schedule[1]).toBe('Friday')
        expect(schedule[2]).toBe('08:00')
        expect(schedule[3]).toBe('18:00')
        expect(schedule[4]).toContain('Probation')
        expect(schedule[5]).toContain('Probation 1')
        expect(schedule[5]).toContain('Probation 2')

        expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
        expect(courtsService.getAllEnabledCourts).toHaveBeenCalledWith(user)
        expect(probationTeamsService.getAllEnabledProbationTeams).toHaveBeenCalledWith(user)
        expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
      })
  })
})

describe('POST', () => {
  it(`should delete a schedule and redirect`, () => {
    adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule())
    const { scheduleId } = aLocationWithSchedule().extraAttributes.schedule[0]

    return request(app)
      .post(`/admin/delete-schedule/HEI/${dpsLocationId}/${scheduleId}`)
      .send({})
      .expect(302)
      .expect('location', `/admin/view-prison-room/HEI/${dpsLocationId}`)
      .expect(() => {
        expect(adminService.deleteRoomSchedule).toHaveBeenCalledWith(dpsLocationId, scheduleId, user)
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
