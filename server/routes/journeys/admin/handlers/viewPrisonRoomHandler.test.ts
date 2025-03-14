import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import config from '../../../../config'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'
import {
  CreateDecoratedRoomRequest,
  CreateRoomScheduleRequest,
  AmendDecoratedRoomRequest,
} from '../../../../@types/bookAVideoLinkApi/types'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import AdminService from '../../../../services/adminService'
import PrisonService from '../../../../services/prisonService'
import { radioOptions } from '../../../testutils/cheerio'

import {
  aDecoratedLocation,
  aListOfCourts,
  aListOfProbationTeams,
  aLocationWithSchedule,
  anUndecoratedLocation,
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
  // Feature toggled
  config.featureToggles.adminLocationDecorationEnabled = true

  app = appWithAllRoutes({
    services: { prisonService, courtsService, probationTeamsService, adminService },
    userSupplier: () => user,
  })

  probationTeamsService.getUserPreferences.mockResolvedValue(userPreferencesProbation())
  courtsService.getUserPreferences.mockResolvedValue(userPreferencesCourt())
  prisonService.getPrisonByCode.mockResolvedValue(aPrison())
  adminService.getLocationByDpsLocationId.mockResolvedValue(aDecoratedLocation(dpsLocationId))
  courtsService.getAllEnabledCourts.mockResolvedValue(aListOfCourts())
  probationTeamsService.getAllEnabledProbationTeams.mockResolvedValue(aListOfProbationTeams())
  adminService.createRoomAttributes.mockResolvedValue(aDecoratedLocation(dpsLocationId))
  adminService.amendRoomAttributes.mockResolvedValue(aDecoratedLocation(dpsLocationId))
  adminService.createRoomSchedule.mockResolvedValue(aSchedule())
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View prison room handler', () => {
  describe('GET', () => {
    it(`should render an undecorated room with defaults`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(anUndecoratedLocation(dpsLocationId))

      return request(app)
        .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Room One`)

          const statusRadios = radioOptions($, 'roomStatus')
          expect(statusRadios.length).toBe(2)

          const permissionRadios = radioOptions($, 'permission')
          expect(permissionRadios.length).toBe(4)

          const defaultStatus = $("input[type='radio'][name='roomStatus']:checked").val()
          expect(defaultStatus).toBe('active')

          const defaultPermission = $("input[type='radio'][name='permission']:checked").val()
          expect(defaultPermission).toBe('shared')

          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
          expect(courtsService.getAllEnabledCourts).toHaveBeenCalledWith(user)
          expect(probationTeamsService.getAllEnabledProbationTeams).toHaveBeenCalledWith(user)
          expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
        })
    })

    it(`should render a decorated room with a specific court permission`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aDecoratedLocation(dpsLocationId, 'COURT', ['C1']))

      return request(app)
        .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Room One`)

          const roomStatus = $("input[type='radio'][name='roomStatus']:checked").val()
          expect(roomStatus).toBe('active')

          const roomPermission = $("input[type='radio'][name='permission']:checked").val()
          expect(roomPermission).toBe('court')

          const specificCourts = $('[name="courtCodes"] option:selected').text()
          expect(specificCourts).toContain('Court 1')
        })
    })

    it(`should render a decorated room with a specific probation permission`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(
        aDecoratedLocation(dpsLocationId, 'PROBATION', ['P1', 'P2']),
      )

      return request(app)
        .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Room One`)

          const roomStatus = $("input[type='radio'][name='roomStatus']:checked").val()
          expect(roomStatus).toBe('active')

          const roomPermission = $("input[type='radio'][name='permission']:checked").val()
          expect(roomPermission).toBe('probation')

          const specificTeams = $('[name="probationTeamCodes"] option:selected').text()
          expect(specificTeams).toContain('Probation 1')
          expect(specificTeams).toContain('Probation 2')
        })
    })

    it(`should render a decorated room with an existing schedule`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId, 'COURT', []))

      return request(app)
        .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Room One`)

          const roomStatus = $("input[type='radio'][name='roomStatus']:checked").val()
          expect(roomStatus).toBe('active')

          const roomPermission = $("input[type='radio'][name='permission']:checked").val()
          expect(roomPermission).toBe('schedule')

          const existingSchedule = $("input[type='hidden'][name='existingSchedule']").val()
          expect(existingSchedule).toBe('true')

          const schedule: string[] = $('table > tbody > tr > td')
            .toArray()
            .map(i => $(i).text())

          expect(schedule.length).toBe(7)
          expect(schedule[4]).toContain('Court')
          expect(schedule[5]).not.toContain('Court 1')
          expect(schedule.splice(0, 4)).toEqual(['Monday', 'Friday', '08:00', '18:00'])
        })
    })

    it(`should render a decorated room with existing probation-specific schedule`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(
        aLocationWithSchedule(dpsLocationId, 'PROBATION', ['P1']),
      )

      return request(app)
        .get(`/admin/view-prison-room/HEI/${dpsLocationId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Room One`)

          const roomStatus = $("input[type='radio'][name='roomStatus']:checked").val()
          expect(roomStatus).toBe('active')

          const roomPermission = $("input[type='radio'][name='permission']:checked").val()
          expect(roomPermission).toBe('schedule')

          const existingSchedule = $("input[type='hidden'][name='existingSchedule']").val()
          expect(existingSchedule).toBe('true')

          const schedule: string[] = $('table > tbody > tr > td')
            .toArray()
            .map(i => $(i).text())

          expect(schedule.length).toBe(7)
          expect(schedule[4]).toContain('Probation')
          expect(schedule[5]).toContain('Probation 1')
          expect(schedule.splice(0, 4)).toEqual(['Monday', 'Friday', '08:00', '18:00'])
        })
    })
  })

  describe('POST', () => {
    it(`should accept a minimal room POST and redirect`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(anUndecoratedLocation(dpsLocationId))

      return request(app)
        .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
        .send({
          roomStatus: 'active',
          permission: 'shared',
          existingSchedule: 'false',
          videoUrl: 'link',
          notes: 'comments',
        })
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
      adminService.getLocationByDpsLocationId.mockResolvedValue(aDecoratedLocation(dpsLocationId, 'SCHEDULE', []))

      return request(app)
        .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
        .send({
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
        })
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
      adminService.getLocationByDpsLocationId.mockResolvedValue(
        aLocationWithSchedule(dpsLocationId, 'PROBATION', ['P1', 'P2']),
      )

      return request(app)
        .post(`/admin/view-prison-room/HEI/${dpsLocationId}`)
        .send({
          roomStatus: 'active',
          permission: 'schedule',
          existingSchedule: 'true',
          videoUrl: 'link',
          notes: 'comments',
        })
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
})
