const { askQuestionWithSources } = require('../conversation')

module.exports = {
  method: 'GET',
  path: '/conversation',
  options: {
    tags: ['api'],
    handler: async (request, h) => {
      const results = await askQuestionWithSources('What are we doing keep britain tidy?')
      return h.response(results).code(200)
    }
  }
}
