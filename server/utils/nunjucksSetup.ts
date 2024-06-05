/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import { map } from 'lodash'
import { addYears } from 'date-fns'
import { formatDate, initialiseName } from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'
import { FieldValidationError } from '../middleware/validationMiddleware'
import BavlJourneyType from '../routes/enumerator/bavlJourneyType'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Book A Video Link'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''

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
  njkEnv.addFilter('map', map)
  njkEnv.addFilter('filter', (l: object[], iteratee: string, eq: unknown) => l.filter(o => o[iteratee] === eq))
  njkEnv.addFilter('findError', (v: FieldValidationError[], i: string) => v?.find(e => e.fieldId === i))
  njkEnv.addFilter('formatDate', formatDate)

  njkEnv.addGlobal('exampleDatePickerDate', () => `29/9/${formatDate(addYears(new Date(), 1), 'yyyy')}`)

  // Enums
  njkEnv.addGlobal('BavlJourneyType', BavlJourneyType)
}
