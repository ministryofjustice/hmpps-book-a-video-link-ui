import bunyan from 'bunyan'
import bunyanFormat from 'bunyan-format'
import config from './server/config'

const formatOut = bunyanFormat({ outputMode: 'short', color: !config.production })

const logger = bunyan.createLogger({ name: 'Hmpps Book A Video Link Ui', stream: formatOut, level: 'debug' })

if (process.env.NODE_ENV === 'unit-test') {
  logger.level(bunyan.FATAL + 1)
}

export default logger
