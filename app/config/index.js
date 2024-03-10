const Joi = require('joi')
const blobConfig = require('./storage/blob')
const tableConfig = require('./storage/table')
const dbConfig = require('./db')
const openaiConfig = require('./openai')

const schema = Joi.object({
  port: Joi.number().default(3001),
  env: Joi.string().valid('development', 'test', 'production').default('development')
})

const config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

const value = result.value

value.blobConfig = blobConfig
value.tableConfig = tableConfig
value.dbConfig = dbConfig
value.openaiConfig = openaiConfig

value.isDev = value.env === 'development'
value.isTest = value.env === 'test'
value.isProd = value.env === 'production'

module.exports = value
