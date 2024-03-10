const Joi = require('joi')

const schema = Joi.object({
  useConnectionString: Joi.bool().default(false),
  connectionString: Joi.string().when('useConnectionString', { is: true, then: Joi.required(), otherwise: Joi.allow('').optional() }),
  storageAccount: Joi.string().required(),
  documentTable: Joi.string().default('documents'),
  promptTable: Joi.string().default('prompts')
})

const config = {
  useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
  connectionString: process.env.AZURE_STORAGE_AI_CONNECTION_STRING,
  storageAccount: process.env.AZURE_STORAGE_AI_ACCOUNT_NAME,
  documentTable: 'documents',
  promptTable: 'prompts'
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The storage config is invalid. ${result.error.message}`)
}

module.exports = result.value
