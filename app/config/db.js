const Joi = require('joi')

// Define config schema
const schema = Joi.object({
  postgresConnectionOptions: Joi.object({
    type: Joi.string().required(),
    host: Joi.string().required(),
    port: Joi.number().required(),
    user: Joi.string().required(),
    password: Joi.string().required(),
    database: Joi.string().required()
  }).required(),
  tableName: Joi.string().required(),
  columns: Joi.object({
    idColumnName: Joi.string().required(),
    vectorColumnName: Joi.string().required(),
    contentColumnName: Joi.string().required(),
    metadataColumnName: Joi.string().required()
  }).required()
})

const config = {
  postgresConnectionOptions: {
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
  },
  tableName: 'testlangchain',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'vector',
    contentColumnName: 'content',
    metadataColumnName: 'metadata'
  }
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The db config is invalid. ${result.error.message}`)
}

module.exports = result.value
