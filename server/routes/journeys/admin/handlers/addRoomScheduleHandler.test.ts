import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'
import { CreateRoomScheduleRequest } from '../../../../@types/bookAVideoLinkApi/types'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import AdminService from '../../../../services/adminService'
import PrisonService from '../../../../services/prisonService'
import { getByName, radioOptions } from '../../../testutils/cheerio'

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

describe('Add room schedule handler', () => {
  describe('GET', () => {
    it(`should render the add schedule form correctly`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId, 'COURT', ['C1']))

      return request(app)
        .get(`/admin/add-schedule/HEI/${dpsLocationId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const existingSchedule = $("input[type='hidden'][name='existingSchedule']").val()
          expect(existingSchedule).toBe('true')

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Add another room schedule for Room One`)

          const schedule: string[] = $('table > tbody > tr > td')
            .toArray()
            .map(i => $(i).text())

          expect(schedule.length).toBe(7)
          expect(schedule[4]).toContain('Court')
          expect(schedule[5]).toContain('Court 1')
          expect(schedule.splice(0, 4)).toEqual(['Monday', 'Friday', '08:00', '18:00'])

          const startDayOptions = getByName($, 'scheduleStartDay')
            .find('option')
            .map((_, option) => $(option).attr('value'))
            .get()

          expect(startDayOptions.length).toBe(7)

          const endDayOptions = getByName($, 'scheduleEndDay')
            .find('option')
            .map((_, option) => $(option).attr('value'))
            .get()

          expect(endDayOptions.length).toBe(7)

          const schedulePermissionOptions = radioOptions($, 'schedulePermission')
          expect(schedulePermissionOptions.length).toBe(3)

          const scheduleTimeOptions = radioOptions($, 'allDay')
          expect(scheduleTimeOptions.length).toBe(2)

          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
          expect(courtsService.getAllEnabledCourts).toHaveBeenCalledWith(user)
          expect(probationTeamsService.getAllEnabledProbationTeams).toHaveBeenCalledWith(user)
          expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
        })
    })
  })

  describe('POST', () => {
    it(`should accept a valid POST body and redirect`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId, 'COURT', ['C1']))

      return request(app)
        .post(`/admin/add-schedule/HEI/${dpsLocationId}`)
        .send({
          existingSchedule: 'true',
          scheduleStartDay: '1',
          scheduleEndDay: '3',
          allDay: 'Yes',
          schedulePermission: 'court',
          scheduleCourtCodes: ['C1'],
        })
        .expect(302)
        .expect('location', `/admin/view-prison-room/HEI/${dpsLocationId}`)
        .expect(() => {
          expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
          expect(adminService.createRoomSchedule).toHaveBeenCalledWith(
            dpsLocationId,
            {
              startDayOfWeek: 1,
              endDayOfWeek: 3,
              startTime: '07:00',
              endTime: '17:00',
              locationUsage: 'COURT',
              allowedParties: ['C1'],
            } as CreateRoomScheduleRequest,
            user,
          )
        })
    })

    it(`should accept a valid POST body with specific times and redirect`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId, 'COURT', ['C1']))

      return request(app)
        .post(`/admin/add-schedule/HEI/${dpsLocationId}`)
        .send({
          existingSchedule: 'true',
          scheduleStartDay: '1',
          scheduleEndDay: '3',
          schedulePermission: 'court',
          scheduleCourtCodes: ['C1'],
          allDay: 'No',
          scheduleStartTime: { hour: '08', minute: '00' },
          scheduleEndTime: { hour: '10', minute: '00' },
        })
        .expect(302)
        .expect('location', `/admin/view-prison-room/HEI/${dpsLocationId}`)
        .expect(() => {
          expect(adminService.getLocationByDpsLocationId).toHaveBeenCalledWith(dpsLocationId, user)
          expect(adminService.createRoomSchedule).toHaveBeenCalledWith(
            dpsLocationId,
            {
              startDayOfWeek: 1,
              endDayOfWeek: 3,
              startTime: '08:00',
              endTime: '10:00',
              locationUsage: 'COURT',
              allowedParties: ['C1'],
            } as CreateRoomScheduleRequest,
            user,
          )
        })
    })

    it(`should fail validation if no schedule permission is set`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId, 'COURT', ['C1']))

      return request(app)
        .post(`/admin/add-schedule/HEI/${dpsLocationId}`)
        .send({
          existingSchedule: 'true',
          scheduleStartDay: '1',
          scheduleEndDay: '3',
          schedulePermission: undefined,
          scheduleCourtCodes: ['C1'],
          allDay: 'No',
          scheduleStartTime: { hour: '08', minute: '00' },
          scheduleEndTime: { hour: '10', minute: '00' },
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
          expect(adminService.createRoomSchedule).not.toHaveBeenCalled()
        })
    })

    it(`should fail validation if schedule start day is after end day`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId, 'COURT', ['C1']))

      return request(app)
        .post(`/admin/add-schedule/HEI/${dpsLocationId}`)
        .send({
          existingSchedule: 'true',
          scheduleStartDay: '3',
          scheduleEndDay: '1',
          schedulePermission: 'court',
          scheduleCourtCodes: ['C1'],
          allDay: 'No',
          scheduleStartTime: { hour: '08', minute: '00' },
          scheduleEndTime: { hour: '10', minute: '00' },
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
          expect(adminService.createRoomSchedule).not.toHaveBeenCalled()
        })
    })

    it(`should fail validation if schedule start time is after the end time`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId, 'COURT', ['C1']))

      return request(app)
        .post(`/admin/add-schedule/HEI/${dpsLocationId}`)
        .send({
          existingSchedule: 'true',
          scheduleStartDay: '1',
          scheduleEndDay: '3',
          schedulePermission: 'court',
          scheduleCourtCodes: ['C1'],
          allDay: 'No',
          scheduleStartTime: { hour: '12', minute: '00' },
          scheduleEndTime: { hour: '11', minute: '00' },
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
          expect(adminService.createRoomSchedule).not.toHaveBeenCalled()
        })
    })

    it(`should fail validation if no schedule times are set`, () => {
      adminService.getLocationByDpsLocationId.mockResolvedValue(aLocationWithSchedule(dpsLocationId, 'COURT', ['C1']))

      return request(app)
        .post(`/admin/add-schedule/HEI/${dpsLocationId}`)
        .send({
          existingSchedule: 'true',
          scheduleStartDay: '1',
          scheduleEndDay: '3',
          schedulePermission: 'court',
          scheduleCourtCodes: ['C1'],
          allDay: 'No',
          scheduleStartTime: undefined,
          scheduleEndTime: undefined,
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
