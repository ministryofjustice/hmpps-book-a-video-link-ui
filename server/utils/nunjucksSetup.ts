/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import { groupBy, map, startsWith, uniq } from 'lodash'
import { addYears } from 'date-fns'
import { convertToTitleCase, dateAtTime, formatDate, initialiseName, parseDate, toDuration } from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'
import BavlJourneyType from '../routes/enumerator/bavlJourneyType'
import { FieldValidationError } from '../middleware/setUpFlash'
import TimePeriod from '../routes/enumerator/timePeriod'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Book A Video Link'
  app.locals.authUrl = config.apis.hmppsAuth.externalUrl
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  app.locals.feedbackUrl = config.feedbackUrl
  app.locals.reportAFaultUrl = config.reportAFaultUrl
  app.locals.adminLocationDecorationEnabled = config.featureToggles.adminLocationDecorationEnabled

  app.use((req, res, next) => {
    res.locals.session = req.session
    next()
  })

  // Cachebusting version string
  if (production) {
    // Version only changes with new commits
    app.locals.version = applicationInfo.gitShortHash
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
      watch: process.env.NODE_ENV === 'live-development',
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('convertToTitleCase', convertToTitleCase)
  njkEnv.addFilter('map', map)
  njkEnv.addFilter('groupBy', groupBy)
  njkEnv.addFilter('startsWith', startsWith)
  njkEnv.addFilter('find', (l: any[], iteratee: string, eq: unknown) => l.find(o => o[iteratee] === eq))
  njkEnv.addFilter('filter', (l: any[], iteratee: string, eq: unknown) => l.filter(o => o[iteratee] === eq))
  njkEnv.addFilter('findError', (v: FieldValidationError[], i: string) => v?.find(e => e.fieldId === i))
  njkEnv.addFilter('parseDate', parseDate)
  njkEnv.addFilter('formatDate', formatDate)
  njkEnv.addFilter('dateAtTime', dateAtTime)
  njkEnv.addFilter('unique', uniq)
  njkEnv.addFilter('toDuration', toDuration)

  njkEnv.addGlobal('exampleDatePickerDate', () => `29/9/${formatDate(addYears(new Date(), 1), 'yyyy')}`)
  njkEnv.addGlobal('now', () => new Date())

  // Enums
  njkEnv.addGlobal('BavlJourneyType', BavlJourneyType)
  njkEnv.addGlobal('TimePeriod', TimePeriod)

  // Feature toggles
  njkEnv.addGlobal('enhancedProbationJourneyEnabled', config.featureToggles.enhancedProbationJourneyEnabled)
  njkEnv.addGlobal('adminLocationDecorationEnabled', config.featureToggles.adminLocationDecorationEnabled)
}
