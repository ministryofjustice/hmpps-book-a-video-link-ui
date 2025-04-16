import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import AdminService from '../../../../services/adminService'
import PrisonService from '../../../../services/prisonService'

import {
  aListOfCourts,
  aListOfProbationTeams,
  aLocationWithSchedule,
  aPrison,
  aSchedule,
  userPreferencesCourt,
  userPreferencesProbation,
} from '../../../testutils/adminTestUtils'

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
  app = appWithAllRoutes({
    services: { prisonService, courtsService, probationTeamsService, adminService },
    userSupplier: () => user,
  })

  probationTeamsService.getUserPreferences.mockResolvedValue(userPreferencesProbation())
  courtsService.getUserPreferences.mockResolvedValue(userPreferencesCourt())
  prisonService.getPrisonByCode.mockResolvedValue(aPrison())
  courtsService.getAllEnabledCourts.mockResolvedValue(aListOfCourts())
  probationTeamsService.getAllEnabledProbationTeams.mockResolvedValue(aListOfProbationTeams())
  adminService.createRoomSchedule.mockResolvedValue(aSchedule())
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Delete room schedule handler', () => {
  describe('GET', () => {
    it(`should render a room with a blocked schedule to delete`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId, 'BLOCKED', []))
      const { scheduleId } = aLocationWithSchedule(dpsLocationId).extraAttributes.schedule[0]

      return request(app)
        .get(`/admin/delete-schedule/HEI/${dpsLocationId}/${scheduleId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Are you sure you want to delete this schedule for Room One`)

          const schedule: string[] = $('table > tbody > tr > td')
            .toArray()
            .map(i => $(i).text())

          expect(schedule.length).toBe(6)
          expect(schedule[4]).toContain('Blocked')
          expect(schedule.splice(0, 4)).toEqual(['Monday', 'Friday', '08:00', '18:00'])

          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
          expect(courtsService.getAllEnabledCourts).toHaveBeenCalledWith(user)
          expect(probationTeamsService.getAllEnabledProbationTeams).toHaveBeenCalledWith(user)
          expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
        })
    })

    it(`should render a court room schedule with specific courts to delete`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(
        aLocationWithSchedule(dpsLocationId, 'COURT', ['C1', 'C2']),
      )
      const { scheduleId } = aLocationWithSchedule(dpsLocationId).extraAttributes.schedule[0]

      return request(app)
        .get(`/admin/delete-schedule/HEI/${dpsLocationId}/${scheduleId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Are you sure you want to delete this schedule for Room One`)

          const schedule: string[] = $('table > tbody > tr > td')
            .toArray()
            .map(i => $(i).text())

          expect(schedule.length).toBe(6)
          expect(schedule[4]).toContain('Court')
          expect(schedule[5]).toContain('Court 1')
          expect(schedule[5]).toContain('Court 2')
          expect(schedule.splice(0, 4)).toEqual(['Monday', 'Friday', '08:00', '18:00'])

          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
          expect(courtsService.getAllEnabledCourts).toHaveBeenCalledWith(user)
          expect(probationTeamsService.getAllEnabledProbationTeams).toHaveBeenCalledWith(user)
          expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
        })
    })

    it(`should render a probation room schedule with specific teams to delete`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(
        aLocationWithSchedule(dpsLocationId, 'PROBATION', ['P1', 'P2']),
      )
      const { scheduleId } = aLocationWithSchedule(dpsLocationId).extraAttributes.schedule[0]

      return request(app)
        .get(`/admin/delete-schedule/HEI/${dpsLocationId}/${scheduleId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Are you sure you want to delete this schedule for Room One`)

          const schedule: string[] = $('table > tbody > tr > td')
            .toArray()
            .map(i => $(i).text())

          expect(schedule.length).toBe(6)
          expect(schedule[4]).toContain('Probation')
          expect(schedule[5]).toContain('Probation 1')
          expect(schedule[5]).toContain('Probation 2')
          expect(schedule.splice(0, 4)).toEqual(['Monday', 'Friday', '08:00', '18:00'])

          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
          expect(courtsService.getAllEnabledCourts).toHaveBeenCalledWith(user)
          expect(probationTeamsService.getAllEnabledProbationTeams).toHaveBeenCalledWith(user)
          expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
        })
    })
  })

  describe('POST', () => {
    it(`should delete a schedule and redirect`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId))
      const { scheduleId } = aLocationWithSchedule(dpsLocationId).extraAttributes.schedule[0]

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
})
