const Joi = require('joi')

// Define config schema
const schema = Joi.object({
  connectionString: Joi.string().when('useConnectionString', { is: true, then: Joi.required(), otherwise: Joi.allow('').optional() }),
  storageAccount: Joi.string().required(),
  knowledgeBaseContainer: Joi.string().required(),
  documentContainer: Joi.string().required(),
  promptContainer: Joi.string().required(),
  useConnectionString: Joi.boolean().default(false)
})

// Build config
const config = {
  connectionString: process.env.AZURE_STORAGE_AI_CONNECTION_STRING,
  storageAccount: process.env.AZURE_STORAGE_AI_ACCOUNT_NAME,
  knowledgeBaseContainer: 'knowledge-base',
  documentContainer: 'documents',
  promptContainer: 'prompts',
  useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The blob storage config is invalid. ${result.error.message}`)
}

module.exports = result.value
