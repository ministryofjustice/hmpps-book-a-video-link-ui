import express, { Express } from 'express'
import { NotFound } from 'http-errors'
import { v4 as uuidv4 } from 'uuid'

import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import * as auth from '../../authentication/auth'
import type { Services } from '../../services'
import type { ApplicationInfo } from '../../applicationInfo'
import AuditService from '../../services/auditService'
import setUpWebSession from '../../middleware/setUpWebSession'
import { Journey } from '../../@types/express'
import { testUtilRoutes } from './testUtilRoute'
import setUpFlash from '../../middleware/setUpFlash'
import CourtsService from '../../services/courtsService'
import ProbationTeamsService from '../../services/probationTeamsService'
import { Court, ProbationTeam } from '../../@types/bookAVideoLinkApi/types'

jest.mock('../../services/auditService')
jest.mock('../../services/courtsService')
jest.mock('../../services/probationTeamsService')

export const journeyId = () => '9211b69b-826f-4f48-a43f-8af59dddf39f'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
}

export const user: Express.User = {
  name: 'FIRST LAST',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  active: true,
  authSource: 'NOMIS',
  isCourtUser: true,
  isProbationUser: true,
}

export const flashProvider = jest.fn()

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => Express.User,
  journeySessionSupplier: () => Journey,
): Express {
  const app = express()

  flashProvider.mockReturnValue([])

  app.set('view engine', 'njk')

  app.use(setUpWebSession())
  app.use((req, res, next) => {
    req.user = userSupplier()
    req.session.journey = journeySessionSupplier()
    req.session.journeyData = {}
    req.session.journeyData[journeyId()] = { instanceUnixEpoch: Date.now(), ...journeySessionSupplier() }
    req.flash = flashProvider
    res.locals = {
      user: { ...req.user },
    }
    next()
  })
  app.use((req, res, next) => {
    req.id = uuidv4()
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(setUpFlash())
  nunjucksSetup(app, testAppInfo)
  app.use(routes(services))
  app.use(testUtilRoutes())
  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {},
  userSupplier = () => user,
  journeySessionSupplier = () => ({}),
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => Express.User
  journeySessionSupplier?: () => Journey
}): Express {
  const auditService = new AuditService(null) as jest.Mocked<AuditService>
  const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
  const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>

  auditService.logPageView.mockResolvedValue(null)
  courtsService.getUserPreferences.mockResolvedValue([
    { code: 'C1', description: 'Court 1' },
    { code: 'C2', description: 'Court 2' },
  ] as Court[])
  probationTeamsService.getUserPreferences.mockResolvedValue([
    { code: 'P1', description: 'Probation 1' },
    { code: 'P2', description: 'Probation 2' },
  ] as ProbationTeam[])

  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(
    {
      auditService,
      courtsService,
      probationTeamsService,
      ...services,
    } as Services,
    production,
    userSupplier,
    journeySessionSupplier,
  )
}
