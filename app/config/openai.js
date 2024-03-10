const Joi = require('joi')

const schema = Joi.object({
  apiKey: Joi.string().required()
})

const config = {
  apiKey: process.env.OPENAI_API_KEY
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The openAi config is invalid. ${result.error.message}`)
}

module.exports = result.value
