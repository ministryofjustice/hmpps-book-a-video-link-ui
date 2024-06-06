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
import { Journey, JourneyData } from '../../@types/express'
import { testUtilRoutes } from './testUtilRoute'
import setUpFlash from '../../middleware/setUpFlash'

jest.mock('../../services/auditService')

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
    req.session.journeyData = new Map<string, JourneyData>()
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
  services = {
    auditService: new AuditService(null) as jest.Mocked<AuditService>,
  },
  userSupplier = () => user,
  journeySessionSupplier = () => ({}),
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => Express.User
  journeySessionSupplier?: () => Journey
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(services as Services, production, userSupplier, journeySessionSupplier)
}
